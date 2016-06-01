    var myClass = React.createClass({
      getInitialState : function(){
        return {name: 'Robin'};
      };
      changeName(name) : function(){
        setState({name:name});
      }
      render: function(){
        return(
            <div> 
              HELLO {this.state.name}
              <myClass2 >
            </div>
          )
      }
    });
    
    var myClass2

    var SettingUpBoard = React.createClass({
      //props:
      //this.props.joinRoom: function
      //this.props.players: []
        getInitialState: function() {
          // return {newGameBoard: true, newInvitationBoard: false, newInvitationFrom: ''};
          return {newGameBoard: false, newInvitationBoard: true, newInvitationFrom: 'julien'};
        },
        eventNewInvitationFrom: function(pName){//event
          this.setState({newGameBoard: false, newInvitationBoard: true, newInvitationFrom: pName});
        },
        handleNewInvitation: function(action){
          // alert(action);
          if (action=='accept'){
            this.setState({newInvitationBoard: false, newInvitationFrom: ''});
          //   //send message
          //   this.handleJoinRoom();
          } else if (action=='refuse'){
            this.setState({newGameBoard: true, newInvitationBoard: false, newInvitationFrom: ''});
          //   //send message

          } else {
          //   //throw error
          }
        },
        handleJoinRoom: function(){
          this.setState({newInvitationBoard: false, newInvitationFrom: ''});
            //TODO: et la ??
        },
        render: function(){
          return (
            <div>
              <NewGameBoard handleJoinRoom={this.handleJoinRoom} players={this.props.players} className={!this.state.newGameBoard?'hidden':''}/>
              <NewInvitationBoard playerNameWhoInvitedYou={this.state.newInvitationFrom} className={!this.state.newInvitationBoard?'hidden':''} handleNewInvitation={this.handleNewInvitation}/>
            </div>
         )
        }
      });
              // <NewGameBoard players={this.props.players} handleJoinRoom={this.handleJoinRoom}/>
    var NewInvitationBoard = React.createClass({
        //props=players
        //state=playerNameWhoInvitedYou
        getInitialState: function() {
          return {null};
        },
        acceptInvitation: function(){
            //send message
          this.props.handleNewInvitation('accept');
        },
        refuseInvitation: function(){
          this.props.handleNewInvitation('refuse');
        },
        render: function(){
          return (
            <div className={this.props.className}>
              <p> {this.props.playerNameWhoInvitedYou} invited you for a game!</p>
              <button onClick={this.acceptInvitation}>Accept</button>
              <button onClick={this.refuseInvitation}>Refuse</button>
            </div>
         )
        }
      });
              // <button onClick={this.props.handleNewInvitation('refuse')}>Refuse</button>
      var NewGameBoard = React.createClass({
      //props=players
      //state=invitesFriends
        getInitialState: function() {
          return {newGame: true, inviteFriends: false, leaveRoom: false, launchGame: false, inviteFriendsBoard:false, playersToInvite: []};
        },
        handleNewGame: function() {
          this.setState({newGame: false, inviteFriends: true, leaveRoom: true, launchGame: true});
        },
        handleInviteFriends: function() {
          this.setState({newGame: false, inviteFriends: false, leaveRoom: false, launchGame: false, inviteFriendsBoard:true});
        },
        handleLeaveRoom: function() {
          this.setState({newGame: true, inviteFriends: false, leaveRoom: false, launchGame: false});
        },
        handleLaunchGame: function() {
          this.setState({newGame: false, inviteFriends: false, leaveRoom: false, launchGame: false});
        },
        handleFriendInvitation(){
            //send invite message (this.state.playersToInvite)
            this.setState({inviteFriendsBoard:false});
        },
        cancelFriendInvitation(){
            this.setState({inviteFriendsBoard:false, newGame: false, inviteFriends: true, leaveRoom: true, launchGame: true});
        },
        render: function(){//TODO: manage player selection for invitation
          var players = this.props.players.map(function(player) {
            return (
              <li> <a>{player.name}</a></li>
              // InvitablePlayer
            );
          });
          return (
            <div className={this.props.className}>
              <button id="newGameButton" className={!this.state.newGame?'hidden':''} type='button' onClick={this.handleNewGame}> New Game </button> 
              <button id="inviteFriendsButton" className={!this.state.inviteFriends?'hidden':''} type='button' onClick={this.handleInviteFriends}> Invite Friends </button> 
            <div id="inviteFriendsBoard" className={!this.state.inviteFriendsBoard?'hidden':''}>
              <ul>
                {players}
              </ul>
              <button onClick={this.handleFriendInvitation}>Invite</button>
              <button onClick={this.cancelFriendInvitation}>Cancel</button>
            </div>
              <button id="leaveRoomButton" className={!this.state.leaveRoom?'hidden':''} type='button' onClick={this.handleLeaveRoom}> Leave Room </button> 
              <button id="launchGameButton" className={!this.state.launchGame?'hidden':''} type='button' onClick={this.handleLaunchGame}> Play </button> 
            </div>
         )
        }
      });
    var InvitablePlayer = React.createClass({
      render: function(){
        return(
          <div></div>
        )
      }
    });
    var players = [{name:'player1'},{name:'player2'},{name:'player3'}];//TODO: get players
     ReactDOM.render(
        <div>
          <SettingUpBoard players={players}/>
        </div>,
        document.getElementById('example')
      );