var socket = io();

var CoincheApp = React.createClass({
  getInitialState: function(){
    return {players:[], peopleInRoom:[],settingUpBoard: true, playBoard: false}
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

    socket.on('joinRoom', function(context){
      // console.log('received join room ');
      // console.log(context);
      self.setState({/*settingUpBoard: true,*/ playBoard: true, peopleInRoom: context.players});
      // self.handleJoinRoom(context);
      // self.setState({settingUpBoard: false, playBoard: true});
    });
    socket.on('join',function(data){
      console.log('join');
      console.log({data:data});
      if (data.accept) {
        // alert(data.from + ' joined the room');
        //if not me
        // var players = self.state.peopleInRoom;
        // console.log(players);
        // players.push(data.from);
        // console.log(players);
        // self.setState({peopleInRoom:players});
        self.setState({peopleInRoom: data.players});
      } else {
        // alert(data.from +' did not join the room');
        console.log(data.from +' did not join the room');
      }
    });
    socket.on('leaveRoom', function(data){
      // alert(data.from +' left the room');
      var players = self.state.peopleInRoom;
      players.splice(players.indexOf(data.from),1);
      self.setState({peopleInRoom:players});
    });
    // }, 2);
    // console.log('userData');
      
  },
  handleLeaveRoom: function(context){
    this.setState({peopleInRoom:[], settingUpBoard:true, playBoard:false});
  },
	render: function(){
		return (
      <div>
        <SettingUpBoard players={this.state.players} className={!this.state.settingUpBoard?'hidden':''}/>
        <PlayBoard players={this.state.peopleInRoom} leaveRoom={this.handleLeaveRoom} className={!this.state.playBoard?'hidden':''}/>
      </div>
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
    componentDidMount: function() {
      var self=this;
      socket.on('roomInvitation', function(data){
        console.log('roomInvitation from ' + data.from);
        self.setState({newGameBoard: false, newInvitationBoard: true, newInvitationFrom:data.from});
      });
    },
    eventNewInvitationFrom: function(pName){//event
      this.setState({newGameBoard: false, newInvitationBoard: true, newInvitationFrom: pName});
    },
    handleNewInvitation: function(action){
      // alert(action);
      if (action=='accept'){
        this.setState({newInvitationBoard: false, newInvitationFrom: ''});
      //   //send message
        socket.emit('acceptInvite',{accept: true});
      //   this.handleJoinRoom();
      } else if (action=='refuse'){
        this.setState({newGameBoard: true, newInvitationBoard: false, newInvitationFrom: ''});
        socket.emit('acceptInvite',{accept: false});
      //   //send message

      } else {
      //   //throw error
      }
    },
    handleJoinRoom: function(){
      this.setState({newInvitationBoard: false, newInvitationFrom: ''});
      //now: doit on remotne l'info, soit on a un lsiten qui nous envoit les infos
    },
    handleNewRoom: function(){
      //now: doit on remotne l'info, soit on a un lsiten qui nous envoit les infos

    },
    render: function(){
      return (
        <div className={this.props.className}>
          <NewGameBoard handleJoinRoom={this.handleJoinRoom}  players={this.props.players} newRoom={this.handleNewRoom} className={!this.state.newGameBoard?'hidden':''}/>
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
      return {inviteFriends: true, leaveRoom: false, launchGame: false, inviteFriendsBoard:false, playersToInvite: []};
    },
    handleNewGame: function() {
      this.setState({inviteFriends: true, leaveRoom: true, launchGame: true});
    },
    handleInviteFriends: function() {
      this.setState({inviteFriends: false, leaveRoom: false, launchGame: false, inviteFriendsBoard:true});
    },
    handleLeaveRoom: function() {
      this.setState({inviteFriends: true, leaveRoom: false, launchGame: false});
      socket.emit('leaveRoom',{});
    },
    handleLaunchGame: function() {
      // this.setState({newGame: false, inviteFriends: false, leaveRoom: false, launchGame: false});
    },
    handleFriendInvitation(){
        //send invite message (this.state.playersToInvite)
        socket.emit('roomInvitation', {to:this.state.playersToInvite});
        this.setState({inviteFriends: true, inviteFriendsBoard:false, playersToInvite:[], leaveRoom: true});
    },
    cancelFriendInvitation(){
        this.setState({inviteFriends:true, inviteFriendsBoard:false,  inviteFriends: true, leaveRoom: true, launchGame: true});
    },
    // handleSelectFriend: function() {
    //   alert('handleSelectFriend');
    //   // this.setState({newGame: false, inviteFriends: true, leaveRoom: true, launchGame: true});
    // },
    handleSelectFriend: function(name){
        // alert(name);
        var friendsSelected = this.state.playersToInvite;
        var targetIndex= friendsSelected.indexOf(name);
        if (targetIndex == -1){
          // console.log('+a');
          friendsSelected.push(name);
        } else {
          // console.log('-a');
          friendsSelected.splice(targetIndex, 1)
        }
        this.setState({playersToInvite:friendsSelected});
        // console.log(this.state.playersToInvite);
    },
    render: function(){//TODO: manage player selection for invitation
      // console.log({'this.prop.player': this.props.players});
      var self=this;
      var players = this.props.players.map(function(player, i) {
        return (
          <li key={i}> <a value={player.name} onClick={self.handleSelectFriend.bind(self, player.name)} >{player.name}</a></li>
        );
      });
      // console.log({players:players});
          // <button value='name' type='button' onClick={alert('jose')} >name</button>
          // <button id="pute" className={!this.state.newGame?'hidden':''}  type='button' onClick={this.handleSelectFriend}> Name </button> 
      return (
        <div className={this.props.className}>
          <button id="inviteFriendsButton" className={!this.state.inviteFriends?'hidden':''} type='button' onClick={this.handleInviteFriends}> Invite Friends For A Game</button> 
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
// var InvitablePlayer = React.createClass({
//   render: function(){
//     return(
//       <div></div>
//     )
//   }
// });
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
////////////////////// PLAY BOARD/////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
var PlayBoard = React.createClass({
//   //props:
//   //state: players[0...3]
  getInitialState: function(){
    return {
//       players: [{name: 'a', announce:'80H', dealer:true, swapButton:true}, {name: 'b', announce:'', dealer:false, swapButton:false}, {name: 'c', announce:'', dealer:false, swapButton:false}, {name: 'd', announce:'', dealer:false, swapButton:false}],
//       cards: [{value:'7',color:'H', playable:true}, {value:'9',color:'H', playable:true}, {value:'J',color:'H', playable:true}],
//       playedCards: [{value:'7',color:'S', playable:true}, {value:'9',color:'S', playable:true}],
//       currentAnnounce: {value:'100',color:'AT'}
          aa:null
    };
  },
//   handleAnnounce: function(){
//     alert('announce');
//   },
  render: function(){
    var PlayersSpace = this.props.players.map(function(pName, i) {
      var player = {name: pName};
      var places = ["SOUTH","EAST","NORTH","WEST"];
      return (
        <PlayerSpace key={i} playerSpace={player} place={places[i]}/>
      );
    });
    return(
      <div className={this.props.className}>
        {PlayersSpace}
      </div>
        // <AnnounceBoard currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>
        // <Tapis cards={this.state.playedCards}/>
        // <h1> You are on the PlayBoard </h1>
        // <MySpace cards={this.state.cards}/>
    )
  }
});
var PlayerSpace = React.createClass({
  render: function(){
    return (
      <div id={'playerSpace' + this.props.playerSpace.name}>
        <div id={this.props.place}> {this.props.place} : {this.props.playerSpace.name} </div>
        <button>Swap Place</button>
      </div>
    )
  }
});
        // <div id={'announce' + this.props.playerSpace.name}>{this.props.playerSpace.announce}</div>
        // <div id={'dealer' + this.props.playerSpace.name} className={this.props.playerSpace.dealer?'':'hidden'}>D</div>
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