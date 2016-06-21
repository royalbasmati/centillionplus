angular.module('MainCtrl', [])
.controller('MainController', function($scope, Main, $interval, $location) {

  $scope.dcydrObjDefaults = JSON.stringify({ 
    stateView: 1,
    yes: 0,
    no: 0,
    totalVotes: 3,
    allVotesIn: false,
    result: null
  });

  // Voter object default initial set up (copy the object so the two are not connected):
  $scope.dcydrObj = JSON.parse($scope.dcydrObjDefaults);

  //For displaying user's vote on view3
  $scope.userVote = null;

  //For keeping track of vote result on client
  $scope.localResult = null;

  //For keep track of vote starter
  $scope.voteStarter = false;

  
  //Listen to any server-side stateView changes via the socket, and update $scope.dcydrObj accorgingly
  Main.socket.on('stateViewChange', function(data) {
    // Update the voter object to reflect the new data
    $scope.dcydrObj = data;
    //check if local result is not null
    if ($scope.localResult !== null) {
      //do not change view
      return;
    } else {
    // Update local result
      $scope.localResult = data.result;
    }
    // Change the route as appropriate
    Main.updateView(data.stateView);
    // This line seems to be needed to make sure all clients update appropriately:
    $scope.$apply();
  });


//---view1-------------------------------------------------------

  //When '+' is clicked on view1, $scope.dcydrObj.totalVotes is changed accordingly  
  $scope.incNumOfVoters = function() {
    //Set max number of voters to 15 for now.  This may change..
    if ($scope.dcydrObj.totalVotes < 15) {
      $scope.dcydrObj.totalVotes += 1;
    }
  };

  //When '-' is clicked on view1, $scope.dcydrObj.totalVotes is changed accordingly  
  $scope.decNumOfVoters = function() {
    //Min number of voters is 1 - for now..
    if ($scope.dcydrObj.totalVotes > 1) {
      $scope.dcydrObj.totalVotes -= 1;
    }
  };

  //Initiated when user hits 'Start!'.  take in number of votes from view1.  
  // Sends POST request to update the server
  // (causes all users views will switch to v2a, handled via sockets)
  $scope.go = function() {
    //set this client as vote starter
    $scope.voteStarter = true;
    Main.startVoting({'votes': $scope.dcydrObj.totalVotes}).
      catch(function (err) {
        console.log(err);
      });
  };

//---view2------------------------------------------------------

  //Take user vote input and post to server - called when user clicks Y/N on view2a.html
  $scope.postVoteYes = function() {
    $scope.userVote = 'yes';
    Main.addVoteYes().
      catch(function (err) {
        console.log(err);
      }).then($location.path('/view3'));
  };

  $scope.postVoteNo = function() {
    $scope.userVote = 'no';
    Main.addVoteNo().
      catch(function (err) {
        console.log(err);
      }).then($location.path('/view3'));
  };

  //Reset stateView - visible on views 2 and 3
  $scope.reset = function() {
    //Confirm pop-up
    if (confirm('Are you sure you want to reset?')) {
      //Reset dcydr object to defaults (copy the object so the two are not connected)
      $scope.dcydrObj = JSON.parse($scope.dcydrObjDefaults);
      // reset localResult 
      $scope.localResult = null;
      //check current state
      Main.getState().then(function(state) {
        //check if result is not null or voteStarter is true
        if (state.data.result !== null || voteStarter) {
          //reset the voteStarter
          $scope.voteStarter = false;
          //API call to reset state on server
          Main.resetState(state).then(function (state) {
            //Reset view
            Main.updateView(state.data.stateView);
          });
        } else {
          //Update view without reset
          Main.updateView(state.data.stateView);
        }
      });
      
    }
  };
});