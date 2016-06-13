var socket = io();

var CoincheApp = React.createClass({
  getInitialState: function(){
    return {youInviteThem: true, playersToInvite:[], theyInviteYou: false, inviteFrom: null, playBoard: true, 
      peopleInRoom:[{},{},{},{}], leaveButton: false}
  },
  componentDidMount: function() {
    var self=this;

    socket.on('userData', function(data){
      self.setState({playersToInvite:data.connectedUsers});
    });
    socket.on('newConnection', function(data){
      console.log('SYSTEM: User ' + data.from + ' is connected.');
      self.setState({playersToInvite:data.connectedUsers});
    })
    socket.emit('userData', {msg: 'testmsg'});

    socket.on('joinRoom', function(context){
      // alert('joinROom');
      console.log(context);
      self.setState({peopleInRoom: context.players, leaveButton: true});
    });
    socket.on('join',function(data){
      // console.log('join');
      console.log({data:data});
      if (data.accept) {
        self.setState({peopleInRoom: data.players});
      } else {
        console.log('SYSTEM: ' + data.from +' did not join the room');
      }
    });
    socket.on('leaveRoom', function(data){
      console.log(data.from + ' left the room');
      // alert(data.from +' left the room');
      // var players = self.state.peopleInRoom;
      // players.splice(players.indexOf(data.from),1);
      self.setState({peopleInRoom:data.players});
    });
    socket.on('updateStatus', function(data){//todo: degueu...
        var players = self.state.playersToInvite;
        if (players[data.from]){
          // console.log(' New status for ' + data.from + ': ' + data.status);
          players[data.from].status=data.status;
          self.setState({playersToInvite:players});
        }
    });
    socket.on('swap', function(data){
      self.setState({peopleInRoom:data.players});

    });
    socket.on('startEnabled', function(data){
      self.setState({startButton:true});
      console.log('enable');
    });
    socket.on('startDisabled', function(data){
      self.setState({startButton:false});
      console.log('disable');
    });
    socket.on('startGame', function(data){
      console.log('startGame');
    });

    socket.on('updatePlayerInfo', function(data){
      self.setState({peopleInRoom: data.players});
    });



    socket.on('play', function(data){
      console.log('play');
      console.log({data:data});
    });

      
  },
  handleLeaveRoom: function(){
    socket.emit('leaveRoom', {});
    this.setState({peopleInRoom:[{},{},{},{}], leaveButton:false})
    // alert('leaving room...');
  },
  handleStartGame: function(){
    socket.emit('startGame',{});
  },
  render: function(){
    return (
      <div id='AppROOT'>
        <YouInviteThem players={this.state.playersToInvite} className={!this.state.youInviteThem?'hidden':''}/>
        <TheyInviteYou inviteFrom={this.state.inviteFrom} className={!this.state.theyInviteYou?'hidden':''}/>
        <PlayBoard players={this.state.peopleInRoom} leaveRoom={this.handleLeaveRoom} className={!this.state.playBoard?'hidden':''}/>
        <div className='startGameAndLeaveRoom'>
          <button onClick={this.handleStartGame} className={'startGame ' + (!this.state.startButton?'hidden':'')}>Start Game</button>
          <button onClick={this.handleLeaveRoom} className={'leaveRoom ' + (!this.state.leaveButton?'hidden':'')}>Leave Room</button>
        </div>
      </div>
    );
  }
});
var TheyInviteYou = React.createClass({ //OK
    getInitialState: function() {
      return {display:false,inviteFrom:null};
    },
    componentDidMount: function() {
      var self=this;

      socket.on('roomInvitation', function(data){
        self.setState({display:true, inviteFrom:data.from});
      });                
    },
    acceptInvitation: function(accept){
      this.setState({display: false, inviteFrom:null});
      socket.emit('acceptInvite',{accept:accept});
    },
    render: function(){
      return (
        <div className={'theyInviteYou ' + (this.state.display?'':'hidden')}>
          <p> {this.props.inviteFrom} invited you to join his room!</p>
          <button onClick={this.acceptInvitation.bind(this,true)}>Accept</button>
          <button onClick={this.acceptInvitation.bind(this,false)}>Refuse</button>
        </div>
     )
    }
  });
  var YouInviteThem = React.createClass({
    //props: players = {name=>{name:,status:}}
    getInitialState: function() {
      return {inviteFriends: true,  inviteFriendsBoard:false, playersToInvite: []};
    },
    handleInviteFriends: function() {
      this.setState({inviteFriends: false,  inviteFriendsBoard:true});
    },
    handleSendFriendInvitation: function(){
        socket.emit('roomInvitation', {to:this.state.playersToInvite});
        this.setState({inviteFriends: true, inviteFriendsBoard:false, playersToInvite:[]});//todo: design button to appear clicked
    },
    cancelFriendInvitation: function(){
        this.setState({inviteFriends:true, inviteFriendsBoard:false});
    },
    handleSelectFriend: function(name){
        var friendsSelected = this.state.playersToInvite;
        var targetIndex= friendsSelected.indexOf(name);
        if (targetIndex == -1){
          friendsSelected.push(name);
        } else {
          friendsSelected.splice(targetIndex, 1)
        }
        this.setState({playersToInvite:friendsSelected});
    },
    render: function(){//TODO: manage player selection for invitation
      var self=this;
      var players = Object.keys(this.props.players).map(function(player, i) {
        var name = self.props.players[player].name;
        var status = self.props.players[player].status;
        return (
          <li key={i}> <a value={name} onClick={self.handleSelectFriend.bind(self, name)} >{name + ' - ' + status}</a></li>
        );
      });
      return (
        <div className={'youInviteThem ' + this.props.className}>
          <button id="inviteFriendsButton" className={!this.state.inviteFriends?'hidden':''} type='button' onClick={this.handleInviteFriends}> Invite Friends For A Game</button> 
          <div id="inviteFriendsBoard" className={!this.state.inviteFriendsBoard?'hidden':''}>
            <ul> {players}</ul>
            <button onClick={this.handleSendFriendInvitation}>Invite</button>
            <button onClick={this.cancelFriendInvitation}>Cancel</button>
          </div>
        </div>
     )
    }
  });
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
////////////////////// PLAY BOARD/////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
var PlayBoard = React.createClass({
//   //props:
//   //state: players[0...3]
  getInitialState: function(){
    return {mustAnnounce: false, currentAnnounce: null, players: []
//       players: [{name: 'a', announce:'80H', dealer:true, swapButton:true}, {name: 'b', announce:'', dealer:false, swapButton:false}, {name: 'c', announce:'', dealer:false, swapButton:false}, {name: 'd', announce:'', dealer:false, swapButton:false}],
//       cards: [{value:'7',color:'H', playable:true}, {value:'9',color:'H', playable:true}, {value:'J',color:'H', playable:true}],
//       playedCards: [{value:'7',color:'S', playable:true}, {value:'9',color:'S', playable:true}],
//       currentAnnounce: {value:'100',color:'AT'}
          // null
    };
  },
  componentDidMount: function(){
    var self = this;
    socket.on('announce', function(data){
      console.log('announce');
      console.log({data:data});
      self.setState({mustAnnounce:true, currentAnnounce:data.announce})
    });
    socket.on('announced', function(data){
      console.log('announced');
      console.log({data:data});
    });
    // socket.on('play', function(data){
    //   alert('play:' + data);
    //   // self.setState({mustAnnounce:true, currentAnnounce:data.announce})
    // });
  },
  handleAnnounce: function(){
    this.setState({mustAnnounce: false, currentAnnounce: null});
  },

//   handleAnnounce: function(){
//     alert('announce');
//   },
  render: function(){
    return(
      <div className={'playBoard ' + this.props.className}>
        <div className={'playBoardContainer'}>
          <div className={'row'}>
            <div className='col-xs-offset-4 col-xs-4'>
              <PlayerSpace place='NORTH' playerIndex={2} player={this.props.players[2]}/>
            </div>
          </div>
          <div className={'row'}>
            <div className='col-xs-4'>
              <PlayerSpace place='WEST' playerIndex={1} player={this.props.players[1]}/>
            </div>
            <AnnounceBoard className={this.state.mustAnnounce?'':'hidden'} currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>
            <div className={(this.state.mustAnnounce?'':'col-xs-offset-4 ') + 'col-xs-4'}>
              <PlayerSpace place='EAST' playerIndex={3} player={this.props.players[3]}/>
            </div>
          </div>
          <div className={'row'}>
            <div className='col-xs-offset-4 col-xs-4'>
              <PlayerSpace place='SOUTH' playerIndex={0} player={this.props.players[0]}/>
            </div>
          </div>
          <MySpace />
        </div>
      </div>
        // <AnnounceBoard currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>
        // <Tapis cards={this.state.playedCards}/>
        // <h1> You are on the PlayBoard </h1>
        // <MySpace cards={this.state.cards}/>
    )
  }
});
var PlayerSpace = React.createClass({
  handleSwap: function(pIndex){
    socket.emit('swap', {to:pIndex})
  },
  render: function(){
    return (
      <div id={this.props.place} className={this.props.player.name?'':'hidden'}>
        <p> {this.props.place} : {this.props.player.name} </p>
        <div className={this.props.player.announce?'':'hidden'}>{(this.props.player.announce?'Announce: ' + this.props.player.announce.value + this.props.player.announce.color:'')}</div>
        <div className={this.props.player.dealer?'':'hidden'}>DEALER</div>
        <button className={this.props.playerIndex==0?'hidden':''} onClick={this.handleSwap.bind(this, this.props.playerIndex)}>Swap Place</button>
      </div>
    )
  }
        // <div id={this.props.place}> {this.props.place} : {this.props.playerSpace.name} </div>
});
        // <div id={'announce' + this.props.playerSpace.name}>{this.props.playerSpace.announce}</div>
        // <div id={'dealer' + this.props.playerSpace.name} className={this.props.playerSpace.dealer?'':'hidden'}>D</div>
var AnnounceBoard = React.createClass({
  getInitialState: function(){
    return {value: null, color: null}
  },
  selectValue: function(value){
    this.setState({value:value});
  },
  selectColor: function(color){
    this.setState({color:color});

  },
  handleSubmit: function(action){
    console.log(action);
    if (action == 'coinche'){
      socket.emit('announce',{announce:{value:this.props.currentAnnounce.value,color:this.props.currentAnnounce.color, coinched:true}});
    } else if (action == 'pass'){
      socket.emit('announce',{announce:{value:0,color:null, coinched:false}});
    } else if (action == 'announce'){
      socket.emit('announce',{announce:{value:this.state.value,color:this.state.color, coinched:false}});
    }
    console.log(this.state);
    this.setState({color:null, value:null});
    this.props.handleAnnounce();
  },
  render: function(){
    var availableAnnounce = [80,90,100,110,120,130,140,150,160,170,250,270];
    var currentAnnounceVal=(this.props.currentAnnounce?this.props.currentAnnounce.value:0);
    var self = this;
    var possibleAnnounces=availableAnnounce.map(function(value,i) {
      if (value>currentAnnounceVal){
        return (
          <li key={i}><a onClick={self.selectValue.bind(self, value)}>{value}</a></li>
        );
      } else {
        return null;
      }
    });
    return (
      <div className={'col-xs-4 ' + this.props.className} id='announceBoard'>
        <ul className='list-inline'>
          {possibleAnnounces}
        </ul>
        <ul className='list-inline'>
          <li><a onClick={ this.selectColor.bind(this, 'H') } >H</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'S') } >S</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'D') } >D</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'C') } >C</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'AT') } >AT</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'NT') } >NT</a></li>
        </ul>
        <ul className='list-inline'>
          <li><a onClick={ this.handleSubmit.bind(this, 'announce')}>Announce</a></li>
          <li><a onClick={ this.handleSubmit.bind(this, 'pass')}>Pass</a></li>
          <li><a onClick={ this.handleSubmit.bind(this, 'coinche')}>Coinche</a></li>
        </ul>

      </div>
    )
  }
});
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
var MySpace = React.createClass({
  getInitialState: function(){
    return {cards: []}
  },
  componentDidMount: function() {
    var self = this;
    socket.on('distribute', function(data){
      console.log('distribute');
      console.log({data:data});
      self.setState({cards:data.cards});
    });
  },
  render: function(){
    var cards=this.state.cards.map(function(card,i) {
      return (
        <Card key={i} card={card} className='card cardToBePlayed'/>
      );
    });
    return (
        <div className={'row'}>
          <div className='col-xs-12' id='yourHand'>
            {cards}
          </div>
        </div>
    )
  }
});
var Card = React.createClass({
  render: function(){
    return (
      <img src={'/public/images/cards/' + this.props.card +'.png'} className={'card '+this.props.className}></img>
    );
      // <img src={'/public/images/cards/' + this.props.card.value + this.props.card.color +'.png'} className={'card '+this.props.className}></img>
  }
});

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