//Backbone code goes here
//TODO need to fix input (its in a loop)
$(document).ready(function() {

	//TODO: rename spawnerdiv and spawneddiv (too much room for typos)
	//create model for input div (cannot reset input to placeholder with current version, need to redo)
	//make button templates and make them work
	//make collections for todo items (todo phases, finished lists etc.

	//todo list title model
	var TodoListName = Backbone.Model.extend({

		defaults:{
			todoId: "empty id",
			title: "empty title",
			checking: false,
			completed: false
		}
	});

	var TodoListItem = Backbone.Model.extend({

		defaults:{
			todoId : "empty id",
			rowId : "empty row id",
			text: "empty text",
			completed: false
		}
	});

	//todo list title collection
	var TodoTitleCollection = Backbone.Collection.extend({

		model: TodoListName,

		localStorage: new Backbone.LocalStorage("todotitlestore-backbone"),

		initialize: function(){
			console.log(this.localStorage);
			console.log(this);
			var temparray = this.localStorage.findAll();
			this.localStorage._clear();
			//TODO works now but needs to be reenabled after sortation testing
			for(var i = 0; i < temparray.length; i++)
			{
				console.log(temparray[i].title);
				this.create({
					title: temparray[i].title,
					todoId : temparray[i].todoId,
					completed: temparray[i].completed});
			}
			console.log(this);
		},

		loadLocal: function(temparray){
			console.log("Import function works!");
			console.log(temparray);
			console.log("Previous storage");
			console.log(this);
			this.localStorage._clear();
			for(var i = 0; i < temparray.length; i++)
			{
				console.log(temparray[i].text);
				this.create({
					title: temparray[i].title,
					todoId : temparray[i].todoId,
					completed: temparray[i].completed});
			}
			console.log("Current storage:");
			console.log(this);

		}

	});

	var myTodoCollection = new TodoTitleCollection;

	var TodoItemCollection = Backbone.Collection.extend({

		model: TodoListItem,

		localStorage: new Backbone.LocalStorage("todostore-backbone"),

		initialize: function(){
			var temparray = this.localStorage.findAll();
			this.localStorage._clear();
			for(var i = 0; i < temparray.length; i++)
			{
				console.log(temparray[i].text);
				this.create({
					text: temparray[i].text,
					rowId: temparray[i].rowId,
					todoId: temparray[i].todoId,
					completed: temparray[i].completed
				});
			}
			console.log(this);
		},

		loadLocal: function(temparray){
			console.log("Import function works!");
			console.log(temparray);
			console.log("Previous storage");
			console.log(this);
			this.localStorage._clear();
			for(var i = 0; i < temparray.length; i++)
			{
				console.log(temparray[i].text);
				this.create({
					text: temparray[i].text,
					rowId: temparray[i].rowId,
					todoId: temparray[i].todoId,
					completed: temparray[i].completed
				});
			}
			console.log("Current storage:");
			console.log(this);

		}

	});

	var myTodoItemCollection = new TodoItemCollection;

	var TodoHeaderView = Backbone.View.extend({

		el: "#appHead",

		template: _.template($("#todoHeader").html()),

		events:{
			"click #appClearer" : "clearAll",
			"click #localStorBtn" : "getLocalStor",
			"change #fileUpload" : "importCollection"
		},

		initialize: function(){
			this.todoArray = [];
			this.render();
		},

		render: function(){
			this.$el.html(this.template());
		},

		clearAll: function(){
				for(var i = this.todoArray.length -1; i >= 0; i--)
				{
					//IMPORTANT: need to check if its undefined due to empty elements
					//           unchecked this causes bugs.
					if(this.todoArray[i] != undefined)
					{
						this.todoArray[i].removeTodo();
					}
					delete this.todoArray[i];
				}
		},

		getLocalStor: function(){
			var listItemArray = myTodoItemCollection.localStorage.findAll();
			var listNameArray = myTodoCollection.localStorage.findAll();

			console.log("listItemArray:");
			console.log(listItemArray);
			var downloadArray = [listNameArray, listItemArray];
			console.log(downloadArray);
			//var testarray = window.btoa(JSON.stringify(myTodoItemCollection.localStorage.findAll()));
			var testarray = window.btoa(JSON.stringify(downloadArray));

			$("#localStorBtn").prop("href", "data:application/octet-stream;base64," + testarray);
		},

		importCollection: function(){
			console.log("made it to upload!");
			var file = $("#fileUpload").get(0).files[0];
			console.log(file);

			reader = new FileReader();

			reader.readAsText(file);

			var readArray;

			reader.onloadend = function(){
				readArray = reader.result;
				var parsedArray = JSON.parse(readArray);
				console.log("Parsed Array:");
				console.log(parsedArray[0]);
				$("#fileUpload").wrap("<form>").closest("form").get(0).reset();
				$("#fileUpload").unwrap();
				myTodoHeaderView.clearAll();
				myTodoCollection.loadLocal(parsedArray[0]);
				myTodoItemCollection.loadLocal(parsedArray[1]);
				myTodoInputView.render();
			}
		}
	});

	var myTodoHeaderView = new TodoHeaderView();

	var TodoInputView = Backbone.View.extend({

		el: "#todoMain",

		template: _.template($("#todoSpawner").html()),

		header: myTodoHeaderView,

		events:{
			"click #addDiv" : "createDiv",
			"keypress input" : "keyVal"
		},

		initialize: function(){
			this.render();
		},

		render: function(){
			this.$el.html(this.template);
			console.log(myTodoCollection);
			var completeModels = myTodoCollection.where({completed: true});
			console.log(completeModels);
			if(completeModels.length !== 0)
			{
				this.storageCollect($("#finishedPanel"), completeModels);
			}

			var todoModels = myTodoCollection.where({completed: false});
			console.log(todoModels);
			if(todoModels.length !== 0)
			{
				this.storageCollect(this.$el, todoModels);
			}
		},

		//TODO: fetch models from collection
		storageCollect: function(location, models){
			console.log(models);
			for(var i = 0; i < models.length; i++)
			{
				var todoDiv =  new TodosView({model: models[i]});
				this.header.todoArray.push(todoDiv);
				location.append(todoDiv.render().el);
			}
			console.log(this.header.todoArray);
		},

		//TODO maybe make this a global function
		keyVal: function(e){
			//check if enter was pressed
			if(e.keyCode != 13) return;
			this.createDiv();
		},

		//TODO remove counter and replace with the todoId currently used
		createDiv: function(){
			var inputtxt = $("#inputText").val().trim();
			//check for empty input
			if(!inputtxt) return;

			console.log("Rendering div " + inputtxt);
			//make new todo div
			var arrayIds = myTodoCollection.pluck("todoId");
			console.log(arrayIds);
			if(arrayIds.length == 0)
			{
				var counter = 0;
			}
			else
			{
				var counter = arrayIds[arrayIds.length-1] + 1;
			}
			myTodoCollection.create({todoId: counter, title: inputtxt});
			console.log(myTodoCollection);
			var todoModel = myTodoCollection.findWhere({todoId: counter});
			console.log(todoModel);
			var todoDiv = new TodosView({model : todoModel, id: "todoDiv" + counter});
			this.header.todoArray.push(todoDiv);
			$("#todoMain").append(todoDiv.render().el);
			//TODO select input after input is finished
			//reset input
			counter++;
			$("#inputText").val('');
			return;
		}
	});


	var InputDiv = Backbone.View.extend({

		template: _.template($("#todoinput").html()),

		finishedTemplate: _.template($("#finishedBtn").html()),

		//For use when a todo title is being renamed
		locked: false,

		render: function(mainDiv){
			if($(".finisherBtn").length)
			{
				$(".finisherBtn").detach();
			}

			if(this.locked == true)
			{
				console.log("input locked");
				return;
			}
			//detach from previous Div
			this.$(".panel-body").detach();

			//set new div to attach to
			this.$el = mainDiv;
			var html = this.template();
			this.$el.append(html);

			return this;
		},

		finishBtn: function(){
			console.log("made it to finish btn");
			this.$el.find(".input-group-btn").append(this.finishedTemplate());
		}
	});

	var myInputDiv = new InputDiv;

	var TodosView = Backbone.View.extend({

		className: "panel panel-default",

		collection: myTodoCollection,

		template: _.template($("#spawneddiv").html()),

		replaceTemplate: _.template($("#todoReplace").html()),

		events:{
			"click .panel-heading" : "makeList",
			"keypress #inputLi" : "keyVal",
			"click .inputbutton" : "addListItem",
			"click #remove" : "removeTodo",
			"click #edit" : "editTodo",
			"click .replace" : "replaceTodo",
			"click .finisherBtn" : "completeList"
		},

		render: function(){
			//Check for selected inputs

			console.log(this.model);
			var html = this.template(this.model.toJSON());
			this.$el.append(html);

			this.num = this.model.get("todoId");
			this.mainDiv = "#"+ this.id;
			console.log("current input: " + this.id);

			if(this.model.get("completed") === false)
			{
				this.el.className = "panel panel-info";
				myInputDiv.render(this.$el);
			}
			//load up this views todo list
			this.makeList();
			this.checkCompleted();
			return this;
		},

		keyVal: function(e){
			//check if enter was pressed
			if(e.keyCode != 13) return;
			this.addListItem();
		},

		addListItem: function(){
			var inputtxt = $("#inputLi").val();

			if(!inputtxt)
			{
				console.log("no input");
				return;
			}
			var todoId = this.model.get("todoId")
			//store input in collection
			myTodoItemCollection.create({todoId: todoId, text: inputtxt});

			//make an ID
			var arraytest = myTodoItemCollection.where({todoId: todoId});
			var num = arraytest.length - 1;
			arraytest[num].save({rowId : num});
			console.log(arraytest[num].get("rowId"));
			//add the input to todo list
			var myListItemRow = new ListItemRow({model : arraytest[num], id: "todo" + num});

			this.listenTo(arraytest[num], "change:completed", this.checkCompleted);

			$("#mainTable").append(myListItemRow.render().el);

			$("#inputLi").val("");
			return this;
		},

		makeList: function(){
			if(this.model.get("completed") === true)return;

			//render the input div for inputs
			myInputDiv.render(this.$el);
			if(this.model.get("checking") === true)
			{
				myInputDiv.finishBtn();
			}
			//TODO append the finished button to the inputDiv template

			//get array of inputs from collection
			var arraytest = myTodoItemCollection.where({todoId: this.model.get("todoId")});

			//empty list and add inputs
			myItemTable.emptyTable();

			for(var i = 0; i < arraytest.length; i++){
				var myListItemRow = new ListItemRow({model : arraytest[i], id: "todo" + arraytest[i].attributes.rowId});
				$("#mainTable").append(myListItemRow.render().el);

				this.listenTo(arraytest[i], "change:completed", this.checkCompleted);
			};
		},

		removeTodo: function(){
			console.log("removing todo list");
			var todoId = this.model.get("todoId");
			var arraylist = myTodoItemCollection.where({todoId : todoId});
			for(var i = 0; i < arraylist.length; i++){
				arraylist[i].destroy();
			};
			myItemTable.emptyTable();
			this.model.destroy();
			this.remove();
		},

		editTodo: function(){
			console.log("editing todo list");
			this.$(".panel-heading").html(this.replaceTemplate({replaceinptclass: "replaceinput", replacebtnclass: "replace"}));
			myInputDiv.locked = true;
		},

		replaceTodo: function(){
			console.log("replaceing todo list");
			var inputtxt = this.$(".replaceinput").val();
			if(!inputtxt){
				console.log("no input title");
				return;
			}
			this.model.save({title: inputtxt});
			console.log(this.model);
			this.$(".panel-heading").html("<h3 class=\"panel-title\">" + inputtxt + "</h3>");
			myInputDiv.locked = false;
		},

		checkCompleted: function(){
			var todoId = this.model.get("todoId");
			var itemarray = myTodoItemCollection.where({todoId : todoId});
			var completedarray = myTodoItemCollection.where({todoId : todoId, completed : true});
			console.log("full length: " + itemarray.length + " completed length: " + completedarray.length);
			console.log(itemarray);
			if(itemarray.length === completedarray.length && this.model.get("completed") === false && itemarray.length > 0){
				console.log("Waiting");

				if(this.model.get("checking") === false)
				{
					this.model.save({checking : true});
					myInputDiv.finishBtn();
				}

			}
		},

		completeList: function(){
			this.$(".finisherBtn").hide();
			this.model.save({completed : true});
			myItemTable.emptyTable();
			console.log("model set to true");
			this.$(".panel-body").detach();
			$("#finishedPanel").append(this.$el);
			this.el.className = "panel panel-default";
		}

	});

	var ListItemTable = Backbone.View.extend({

		el: "#todoView",

		template: _.template($("#todoTable").html()),

		initialize: function(){
			this.render();
		},

		render: function(){
			this.$el.append(this.template());
		},

		emptyTable: function(){
			console.log("emptying table");
			this.$("#mainTable").empty();
		}

	});

	var myItemTable = new ListItemTable;

	var ListItemRow = Backbone.View.extend({
		//TODO fix "double tr problem" (delete tr from template and add id on the view);
		tagName: "tr",

		id: "",

		className : "",

		template: _.template($("#itembuttons").html()),

		replaceTemplate: _.template($("#todoReplace").html()),

		events:{
			"click .editbtn" : "itemEdit",
			"click .removebtn" : "itemRemove",
			"click .replacebtn" : "itemReplace",
			"click .finishbtn" : "itemCheck"
		},

		render: function(){
			//TODO make buttons work
			this.$el.html(this.template({input: this.model.get("text")}));
			if(this.model.get("completed") === true){
				this.$el.addClass("success");
			};

			return this;
		},

		itemCheck: function(){
			console.log("Checking item");
			var itemCompleted = this.model.get("completed");

			if(itemCompleted === false)
			{
				this.itemFinish();
			}
			else if(itemCompleted === true)
			{
				console.log("I'm going to change to false");
				this.itemUnFinish();
			}
		},

		itemEdit: function(){
			console.log("Item edited!");
			this.$("td").html(this.replaceTemplate({replaceinptclass: "rowreplaceinpt", replacebtnclass:"replacebtn"}));
		},

		itemRemove: function(){
			this.remove();
			this.model.destroy();
			console.log("Item removed!");
		},

		itemReplace: function(){
			var inputtxt = this.$("input").val();
			this.model.save({ text: inputtxt});
			if(!inputtxt){
				console.log("no input");
				return;
			}
			this.render();
		},

		itemFinish: function(){
			console.log(this.$el.attr("id"));
			this.model.save({completed : true});
			this.$el.addClass("success");
		},

		itemUnFinish: function(){
			this.model.save({completed: false});
			this.$el.removeClass("success");
		}

	});

	var FinishedListTable = Backbone.View.extend({

		el: "#todoFinished",

		template: _.template($("#todoFinishedList").html()),

		initialize: function(){
			this.render();
		},

		render: function(){
			this.$el.html(this.template());
		}
	});

	var myFinishedListTable = new FinishedListTable;

	var ProgressBar = Backbone.View.extend({

		el: "#progressBar",

		collection: myTodoItemCollection,

		template: _.template($("#todoProgressBar").html()),

		initialize: function(){
			this.collection.on("remove", this.progressPercent, this);
			this.collection.on("add", this.progressPercent, this);
			this.collection.on("change:completed", this.progressPercent, this);
			this.progressPercent();
			this.render();
		},

		render: function(percent){
			console.log("Made it to the render function");
			this.$el.html(this.template({num : this.percent}));
		},

		progressPercent: function(){
			//TODO percent dosen't render if the percentage goes below 0
			var completed = this.collection.where({completed: true});

			console.log("completed: " + completed.length + " collection length: " + this.collection.length);
			this.percent = Math.floor((completed.length *100)/ this.collection.length);

			this.render();
		}
	});

	var myTodoInputView = new TodoInputView;
	var myProgressBar = new ProgressBar;

});
