var socket = io();

var CoincheApp = React.createClass({
  getInitialState: function(){
    return {players:[]}
  },
  componentDidMount: function() {
    var self=this;
    // console.log(socket);
    socket.on('userData', function(data){
      // console.log(data);
      self.setState({players:data.connectedUsers});
    });
    // socket.on('hello', function(data){
    //   console.log('hello');
    // });
    // setTimeout(function() {
    socket.emit('userData', {msg: 'testmsg'});
    // }, 2);
    // console.log('userData');
      
  },
	render: function(){
		return (
      <SettingUpBoard players={this.state.players}/>
    );
  }
});
			// <PlayBoard />
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////// SETTNG UP BOARD //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
var SettingUpBoard = React.createClass({
  //props:
  //this.props.joinRoom: function
  //this.props.players: []

    getInitialState: function() {
      // return {newGameBoard: true, newInvitationBoard: false, newInvitationFrom: ''};
      return {newGameBoard: true, newInvitationBoard: false, newInvitationFrom: ''};
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
      // this.setState({newGame: false, inviteFriends: false, leaveRoom: false, launchGame: false});
    },
    handleFriendInvitation(){
        //send invite message (this.state.playersToInvite)
        // socket.emit('newRoom', {to:['a']});
        this.setState({inviteFriendsBoard:false});
    },
    cancelFriendInvitation(){
        this.setState({inviteFriendsBoard:false, newGame: false, inviteFriends: true, leaveRoom: true, launchGame: true});
    },
    render: function(){//TODO: manage player selection for invitation
      console.log({'this.prop.player': this.props.players});
      var players = this.props.players.map(function(player, i) {
        return (
          <li key={i}> <a>{player.name}</a></li>
        );
          // InvitablePlayer
      });
      console.log({players:players});
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

// var PlayBoard = React.createClass({
//   //props:
//   //state: players[0...3]
//   getInitialState: function(){
//     return {
//       players: [{name: 'a', announce:'80H', dealer:true, swapButton:true}, {name: 'b', announce:'', dealer:false, swapButton:false}, {name: 'c', announce:'', dealer:false, swapButton:false}, {name: 'd', announce:'', dealer:false, swapButton:false}],
//       cards: [{value:'7',color:'H', playable:true}, {value:'9',color:'H', playable:true}, {value:'J',color:'H', playable:true}],
//       playedCards: [{value:'7',color:'S', playable:true}, {value:'9',color:'S', playable:true}],
//       currentAnnounce: {value:'100',color:'AT'}

//     };
//   },
//   handleAnnounce: function(){
//     alert('announce');
//   },
//   render: function(){
//     var PlayersSpace = this.state.players.map(function(player) {
//       return (
//         <PlayerSpace playerSpace={player}/>
//       );
//     });
//     return(
//       <div>
//         <AnnounceBoard currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>
//         <Tapis cards={this.state.playedCards}/>
//         {PlayersSpace}
//         <MySpace cards={this.state.cards}/>
//       </div>
//     )
//   }
// });
// var PlayerSpace = React.createClass({
//   render: function(){
//     return (
//       <div id={'playerSpace' + this.props.playerSpace.name}>
//         <p> {this.props.playerSpace.name} </p>
//         <div id={'announce' + this.props.playerSpace.name}>{this.props.playerSpace.announce}</div>
//         <div id={'dealer' + this.props.playerSpace.name} className={this.props.playerSpace.dealer?'':'hidden'}>D</div>
//         <button className={this.props.playerSpace.swapButton?'':'hidden'}>Swap Place</button>
//       </div>
//     )
//   }
// });
// var AnnounceBoard = React.createClass({
//   render: function(){
//     var availableAnnounce = [80,90,100,110,120,130,140,150,160,170,250,270];
//     var currentAnnounceVal=this.props.currentAnnounce.value;
//     var possibleAnnounces=availableAnnounce.map(function(value) {
//     if (value>currentAnnounceVal){
//         return (
//           <li><a>{value}</a></li>
//         );
//       } else {
//         return null;
//       }
//     });
//     return (
//       <div id='announceBoard'>
//         <ul>
//           {possibleAnnounces}
//         </ul>
//         <ul>
//           <li><a>H</a></li>
//           <li><a>S</a></li>
//           <li><a>D</a></li>
//           <li><a>C</a></li>
//           <li><a>AT</a></li>
//           <li><a>NT</a></li>
//         </ul>
//         <ul>
//           <li><a>Announce</a></li>
//           <li><a>Pass</a></li>
//           <li><a>Coinche</a></li>
//         </ul>

//       </div>
//     )
//   }
// });
// var Tapis = React.createClass({
//   //TODO: gérer le positionement (north est west south)
    
//   render: function(){
//     var cards=this.props.cards.map(function(card) {
//       return (
//         <Card card={card} className='card playedCard'/>
//       );
//     });
//     return (
//       <div id='tapis'>
//         {cards}
//       </div>
//     )
//   }
// });
// var MySpace = React.createClass({
//   render: function(){
//     var Cards=this.props.cards.map(function(card) {
//       return (
//         <Card card={card} className='card cardToBePlayed'/>
//       );
//     });
//     return (
//       <div id='mySpace'>
//         {Cards}
//       </div>
//     )
//   }
// });
// var Card = React.createClass({
//   render: function(){
//     return (
//       <img src={'/public/images/cards/' + this.props.card.value + this.props.card.color +'.png'} className={'card '+this.props.className}></img>
//     );
//   }
// });

//RENDER
 ReactDOM.render(
    <div>
      <CoincheApp />
    </div>,
    document.getElementById('topContainer')
  );

// ReactDOM.render(
//   <CoincheApp />,
//   document.getElementById('topContainer')
// );