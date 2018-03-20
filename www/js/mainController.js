app.controller("mainController", function($scope, $http, $timeout, $ionicLoading) {
    var aTask = {
        taskColor: "",
        taskDescription: "",
        hasSubTasks: false,
        isDone: false,
        image: "",
        dateCreated: "-",
        doByDate: "-",
        subTasks: [],
        subTasksCount: 0
    };

    $scope.state = {
        viewList: 0,
        viewTask: 1,
        createTask: 2,
        editTask: 3
    };
    $scope.colorList = ["#D86C70", "#76C4AE", "#CABD80", "#7CE0F9"];
    var dbSize = 5 * 1024 * 1024; // 5MB
    /// open database
    var db = openDatabase("TodoPlus", "1", "Todo manager", dbSize);
    $scope.taskList = [];
    $scope.loadTaskList = function() {
        $scope.showLoading();
        // create table for todos
        db.transaction(function(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                "todo(ID INTEGER  PRIMARY KEY, todoList TEXT)", [],
                function() {
                    console.log("success");
                    $scope.fetchFromDb();
                },
                function() { console.log("failure"); }
            );
        });
        $scope.hideLoading();
    };
    $scope.fetchFromDb = function() {

        db.readTransaction(function(tx) {
            tx.executeSql("SELECT * FROM todo ", [], function(tx, rs) {
                    if (rs.rows.length > 0) {
                        $scope.taskList = [];
                        for (var i = 0; i < rs.rows.length; i++) {
                            var obj = {};
                            obj.id = rs.rows.item(i).ID;
                            obj.data = JSON.parse(rs.rows.item(i).todoList);
                            $scope.taskList.push(angular.copy(obj));
                        }

                        console.log($scope.taskList);

                    } else {
                        //
                    }
                    $scope.showTaskList();
                },
                function(err) {

                    console.log(err);
                });

        });
    }
    $scope.writeToDb = function(task) {
        //insert data into table
        db.transaction(function(tx) {
            var dToday = new Date();
            db.transaction(function(tx) {

                tx.executeSql("INSERT INTO todo( todoList) VALUES(?) ", [JSON.stringify(task)],
                    function() {
                        console.log("successfully inserted");
                        $scope.fetchFromDb();
                    },
                    function() {
                        console.log("failed");
                    }
                );
            });
        });
    };
    $scope.updateTask = function(task, id) {
        //insert data into table
        db.transaction(function(tx) {

            db.transaction(function(tx) {

                tx.executeSql("update todo set todoList = ? where ID = ? ", [JSON.stringify(task), id],
                    function() {
                        console.log("successfully updated");
                        $scope.fetchFromDb();
                    },
                    function() {
                        console.log("failed");
                    }
                );
            });
        });
    };
    $scope.deleteMyTask = function(task) {
        var ans = confirm("Are you sure want to delete task : " + task.data.taskDescription + " ?");
        if (ans) {
            $scope.deleteTask(task.id);
        }
    }
    $scope.deleteTask = function(id) {
        //insert data into table
        db.transaction(function(tx) {

            db.transaction(function(tx) {

                tx.executeSql("delete from todo  where ID = ? ", [id],
                    function() {
                        console.log("successfully deleted");
                        $scope.fetchFromDb();
                    },
                    function() {
                        console.log("failed");
                    }
                );
            });
        });
    };
    $scope.showTaskList = function() {
        $scope.currentState = $scope.state.viewList;
        $scope.$apply();
        console.log($scope.taskList);
    };

    $scope.addNewTask = function() {
        $scope.newTask = angular.copy(aTask);
        $scope.currentState = $scope.state.createTask;
        console.log($scope.newTask);
    };

    $scope.createNewTask = function() {
        console.log($scope.newTask);
        console.log($scope.taskList);
        $scope.writeToDb(angular.copy($scope.newTask));
    };

    $scope.editTask = function(task) {
        $scope.myTask = task.data;
        $scope.myTaskId = task.id;
        $scope.currentState = $scope.state.editTask;
    };

    $scope.updateMyTask = function() {
        $scope.updateTask($scope.myTask, $scope.myTaskId);

    };
    $scope.markItDone = function(task) {
        var tsk = task.data;
        tsk.isDone = !tsk.isDone;
        $scope.updateTask(tsk, task.id);
    };

    $timeout(function() {
        $scope.loadTaskList();
        //$scope.addNewTask();
    });

    /*********************************   ****************************/

    $scope.showLoading = function() {
        $ionicLoading.show({
            template: 'Loading...',
            duration: 10000
        }).then(function() {
            console.log("The loading indicator is now displayed");
        });
    };
    $scope.hideLoading = function() {
        $ionicLoading.hide().then(function() {
            console.log("The loading indicator is now hidden");
        });
    };

});