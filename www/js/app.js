// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('myApp', ['ionic', 'firebase']);
app.controller("mainController", function($scope, $http, $timeout, $ionicLoading, $firebaseObject) {
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
        editTask: 3,
        showInfo: 4,
        login: 5
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

                    $scope.taskList = [];
                    for (var i = 0; i < rs.rows.length; i++) {
                        var obj = {};
                        obj.id = rs.rows.item(i).ID;
                        obj.data = JSON.parse(rs.rows.item(i).todoList);
                        $scope.taskList.push(angular.copy(obj));
                    }

                    console.log($scope.taskList);

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
    $scope.deleteMyTask = function(task_guid, task) {
        var ans = confirm("Are you sure want to delete task : " + task.taskDescription + " ?");
        if (ans) {
            //$scope.deleteTask(task.id);
            for (var guid in $scope.taskList) {
                if (guid == task_guid) {
                    $scope.taskList[guid] = null;
                }
            }
            $scope.saveToFirebase();
            $scope.showTaskList();
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
        $scope.totalTasks = Object.keys($scope.taskList).length - 3; //object already has 3 keys

        console.log($scope.taskList);
    };
    $scope.addNewTask = function() {
        $scope.newTask = angular.copy(aTask);
        $scope.currentState = $scope.state.createTask;

    };

    $scope.createNewTask = function() {
        console.log($scope.newTask);
        console.log($scope.taskList);
        if ($scope.newTask.taskDescription.trim() == "" || $scope.newTask.taskDescription == null) {
            alert("Input task Description");
            return;
        }
        $scope.taskList[uuid.v4()] = angular.copy($scope.newTask);
        $scope.saveToFirebase();
        $scope.showTaskList();

        //$scope.writeToDb(angular.copy($scope.newTask));
    };

    $scope.editTask = function(task) {
        $scope.myTask = task;
        // $scope.myTaskId = task.id;
        $scope.currentState = $scope.state.editTask;
    };

    $scope.updateMyTask = function() {
        // $scope.updateTask($scope.myTask, $scope.myTaskId);
        $scope.saveToFirebase();
        $scope.showTaskList();

    };
    $scope.markItDone = function(task) {
        task.isDone = !task.isDone;
        $scope.saveToFirebase();
    };

    /* Login Register related */
    $scope.login = {
        username: "",
        password: "",
        keepMeLoggedIn: false
    };

    $scope.loginPage = 1;
    $scope.loginUser = function() {
        if ($scope.login.username.trim() == "" || $scope.login.password == "") {
            alert("Enter phone number as username and password");
            return;
        }
        $scope.initializeFirebase();

    }
    $scope.logoutUser = function() {

        localStorage.removeItem("sMD5");
        $scope.currentState = $scope.state.login;
    }


    /*  Making connection and other related to Firbase  */
    $scope.initializeFirebase = function() {

        if ($scope.sKey == null) {
            var sMd5 = CryptoJS.MD5($scope.login.username + $scope.login.password + "topSecret");
            if ($scope.login.keepMeLoggedIn) {
                localStorage.setItem("sMD5", sMd5);
            }

            $scope.sKey = sMd5
        }

        var ref = new Firebase("https://march20-bbce5.firebaseio.com/majorAssignmentProject/" + $scope.sKey + "/data/");
        $scope.taskList = $firebaseObject(ref);

        $scope.showTaskList();
    }
    $scope.saveToFirebase = function() {
        $scope.taskList.$save();
    }

    $timeout(function() {
        // $scope.loadTaskList();
        //$scope.addNewTask();
        $scope.currentState = $scope.state.login;
        $scope.sKey = localStorage.getItem("sMD5");
        if ($scope.sKey != null) {
            $scope.initializeFirebase();
        }


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
/*app.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport
            // from snapping when text inputs are focused. Ionic handles this internally for
            // a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})*/