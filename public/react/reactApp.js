var socket = io();
// console.log(socket);

var CoincheApp = React.createClass({
  getInitialState: function(){
    return {youInviteThem: true, playersToInvite:[], playBoard: true, 
      peopleInRoom:[{},{},{},{}], inRoom: false, inGame: false}
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
      // console.log(context);
      self.setState({peopleInRoom: context.players, inRoom: true});
    });
    socket.on('join',function(data){
      // console.log('join');
      // console.log({data:data});
      if (data.accept) {
        self.setState({peopleInRoom: data.players});
      } else {
        console.log('SYSTEM: ' + data.from +' did not join the room');
      }
    });
    socket.on('leaveRoom', function(data){
      console.log('SYSTEM: ' + data.from + ' left the room');
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
      // console.log('enable');
    });
    socket.on('startDisabled', function(data){
      self.setState({startButton:false});
      // console.log('disable');
    });
    socket.on('startGame', function(data){
      console.log('SYSTEM: starting Game...');
      self.setState({inGame:true});
    });

    socket.on('updatePlayerInfo', function(data){
      // console.log(data.players);
      self.setState({peopleInRoom: data.players});
    });




      
  },
  handleLeaveRoom: function(){
    socket.emit('leaveRoom', {});
    this.setState({peopleInRoom:[{},{},{},{}], inRoom:false, inGame: false, startButton:false})
    // alert('leaving room...');
  },
  handleStartGame: function(){
    socket.emit('startGame',{});
  },
  render: function(){
    return (
      <div id='AppROOT'>
        <YouInviteThem inGame={this.state.inGame} players={this.state.playersToInvite} className={!this.state.youInviteThem?'hidden':''}/>
        <TheyInviteYou />
        <PlayBoard inGame={this.state.inGame} inRoom={this.state.inRoom} players={this.state.peopleInRoom} leaveRoom={this.handleLeaveRoom} className={!this.state.playBoard?'hidden':''}/>
        <button onClick={this.handleStartGame} className={'startGame ' + (!this.state.startButton?'hidden':'')}>Start Game</button>
        <ChatWindow />
        <ChatBar />
      </div>
    );
        // <div className='startGameAndLeaveRoom'>
          // <button onClick={this.handleLeaveRoom} className={'leaveRoom ' + (!this.state.leaveButton?'hidden':'')}>Leave Room</button>
        // </div>
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
          <div> {this.state.inviteFrom} invited you to join his room!</div>
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
        if (status == 'AVAILABLE'){
          return (
            <li key={i} style={{marginTop:'10px'}}> <a value={name} onClick={self.handleSelectFriend.bind(self, name)} className={self.state.playersToInvite.indexOf(name) == -1?'':'selected'}>{name + ' - ' + status}</a></li>
          );
        } else {
          return null;
        }
      });
      return (
        <div className={'youInviteThem ' + this.props.className + ' ' + (this.props.inGame?'hidden':'')}>
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
    return { mustAnnounce: false, currentAnnounce: null,myCards: [],myTurnToPlay: false, playableCards:[], playedCards:[], scores:{round:[null,null],game:[0,0]}};
  },
  componentDidMount: function(){
    var self = this;
    var DISPLAYDELAY = 3000;
    socket.on('announce', function(data){
      setTimeout(function() {
        self.setState({mustAnnounce:true, currentAnnounce:data.announce});
      }, self.getNbPlayedCards() == 4 ? DISPLAYDELAY : 0);
    });
    socket.on('announced', function(data){
    });
    socket.on('distribute', function(data){
      // self.setState({myCards:data.cards});
      setTimeout(function() {
        self.setState({myCards:data.cards});
      }, self.getNbPlayedCards() == 4 ? DISPLAYDELAY : 0);
    });
    socket.on('play', function(data){
      // console.log('play');
      setTimeout(function() {
        self.setState({ myTurnToPlay: true, playableCards:data.cards });
      }, self.getNbPlayedCards() == 4 ? DISPLAYDELAY : 0);
      // self.setState({ myTurnToPlay: true, playableCards:data.cards})
      // console.log({data:data});
    });
    socket.on('endTrick', function(data){
      console.log('endTrick');
      setTimeout(function() {
        self.setState({playedCards:[]});
      }, DISPLAYDELAY);
      // console.log({data:data});
    });
    socket.on('endJetee', function(data){
      console.log('endJetee');
      self.setState({scores:data.scores})
    });
    socket.on('updateScores', function(data){
      self.setState({scores:data.scores})
    });
    socket.on('played', function(data){
      console.log(data.from +' play '+ data.card);
      // console.log(self.state.playedCards);
      self.state.playedCards[data.index] = data.card;
      self.setState({playedCards:self.state.playedCards});//todo: cleaner to reset state
      // console.log(self.state.playedCards);
      // self.setState({ myTurnToPlay: true, playableCards:data.cards})
      console.log({data:data});
      console.log(self.state);
    });
  },
  getNbPlayedCards: function(){ //UGLY USE WORKAROUND TODO TOCHANGE
    var nbPlayedCards = 0;
    for (var i in this.state.playedCards){
      if (this.state.playedCards[i])
        nbPlayedCards++;
    }
    return nbPlayedCards;
  },
  handleAnnounce: function(){
    this.setState({mustAnnounce: false, currentAnnounce: null});
  },
  handleLeaveRoom: function(){
    this.setState({mustAnnounce:false, currentAnnounce:null,myCards: []});
    this.props.leaveRoom();
  },
  handlePlayCard: function(card){
    // console.log('playCard attempt');;
    // if (this.state.playableCards.indexOf(card)!=-1 && this.getNbPlayedCards() < 4){ //TODO UGLY SECOND EXPR
    if (this.state.playableCards.indexOf(card)!=-1){
      this.setState({playableCards:[], myTurnToPlay: false});
      socket.emit('play',{card:card});
      this.state.myCards.splice(this.state.myCards.indexOf(card),1);
      // this.setState({myCards:this.state.myCards};
      // console.log(card + ' played');
    }
  },
  render: function(){
    return(
      <div className={'playBoard ' + this.props.className}>
        <div className={'playBoardContainer'}>
          <div className={'row'}>
            <div className='col-xs-4'>
              <Scores scores={this.state.scores} className={this.props.inGame?'':'hidden'}/>
            </div>
            <div className='col-xs-4'>
              <PlayerSpace inGame={this.props.inGame} place='NORTH' playerIndex={2} player={this.props.players[2]}/>
            </div>
          </div>
          <div className={'row'}>
            <div className='col-xs-4'>
              <PlayerSpace inGame={this.props.inGame} place='WEST' playerIndex={1} player={this.props.players[1]}/>
            </div>
            <PlayedCardsBoard playedCards={this.state.playedCards}/>
            <AnnounceBoard className={'col-xs-4 ' + (this.state.mustAnnounce?'':'hidden')} currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>
            <div className={(this.state.mustAnnounce?'':'col-xs-offset-4 ') + 'col-xs-4'}>
              <PlayerSpace inGame={this.props.inGame} place='EAST' playerIndex={3} player={this.props.players[3]}/>
            </div>
          </div>
          <div className={'row'}>
            <div className='col-xs-offset-4 col-xs-4'>
              <PlayerSpace myTurnToPlay={this.state.myTurnToPlay} inGame={this.props.inGame} place='SOUTH' playerIndex={0} player={this.props.players[0]}/>
            </div>
          </div>
          <MySpace handlePlayCard={this.handlePlayCard} cards={this.state.myCards} playableCards={this.state.playableCards}/>
        </div>
        <button onClick={this.handleLeaveRoom} className={'leaveRoom ' + (this.props.inRoom?'':'hidden')}>Leave Room</button>
      </div>
    )
  }
});
var Scores = React.createClass({
  render: function(){
    return(
      <table id='scores' className={this.props.className}>
        <tr>
          <th></th>
          <th>Us</th>
          <th>Them</th>
        </tr>
        <tr>
          <td>Last Round</td>
          <td>{this.props.scores.round[0]}</td>
          <td>{this.props.scores.round[1]}</td>
        </tr>
        <tr>
          <td>Game</td>
          <td>{this.props.scores.game[0]}</td>
          <td>{this.props.scores.game[1]}</td>
        </tr>
      </table>
    )
  }
});
var PlayedCardsBoard = React.createClass({
  render: function(){
    var positions = ["bottom","left","top","right"];
    var cards=this.props.playedCards.map(function(card,i) {
      return(
        <Card key={i} card={card} className={"playedCard " + positions[i]}/>
      )
    });
    return(
        <div id='playedCardsBoard'>
          {cards}
        </div>
    )
  }
});
var PlayerSpace = React.createClass({
  handleSwap: function(pIndex){
    socket.emit('swap', {to:pIndex})
  },
  render: function(){
    return (
      <div id={this.props.place} className={'playerSpace ' + (this.props.player.name?'':'hidden')}>
        <span> {this.props.place} : {this.props.player.name} </span>
        <span className={this.props.myTurnToPlay?'':'hidden'}>Your turn to play!</span>
        <span className={this.props.player.announce?'':'hidden'}>{(this.props.player.announce?'Announce:' + (this.props.player.announce.value==0?'Pass':this.props.player.announce.value + this.props.player.announce.color):'')}</span>
        <span className={'dealer ' + (this.props.player.dealer?'':'hidden')}>D</span>
        <button className={this.props.playerIndex==0||this.props.inGame?'hidden':''} onClick={this.handleSwap.bind(this, this.props.playerIndex)}>Swap Place</button>
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
    // console.log(action);
    if (action == 'coinche'){
      socket.emit('announce',{announce:{value:this.props.currentAnnounce.value,color:this.props.currentAnnounce.color, coinched:true}});
    } else if (action == 'pass'){
      socket.emit('announce',{announce:{value:0,color:null, coinched:false}});
    } else if (action == 'announce'){
      if (this.state.color && this.state.value){
        socket.emit('announce',{announce:{value:this.state.value,color:this.state.color, coinched:false}});
      } else {
        return;
      }
    }
    // console.log(this.state);
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
          <li key={i}><a onClick={self.selectValue.bind(self, value)} className={self.state.value == value?'selected':''}>{value}</a></li>
        );
      } else {
        return null;
      }
    });
    return (
      <div className={'announceBoard ' + this.props.className} id='announceBoard'>
        <ul className='list-inline'>
          {possibleAnnounces}
        </ul>
        <ul className='list-inline'>
          <li><a onClick={ this.selectColor.bind(this, 'H') } className={self.state.color == 'H'?'selected':''}>H</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'S') } className={self.state.color == 'S'?'selected':''}>S</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'D') } className={self.state.color == 'D'?'selected':''}>D</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'C') } className={self.state.color == 'C'?'selected':''}>C</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'AT') } className={self.state.color == 'AT'?'selected':''}>AT</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'NT') } className={self.state.color == 'NT'?'selected':''}>NT</a></li>
        </ul>
        <ul className='list-inline'>
          <li><a onClick={ this.handleSubmit.bind(this, 'announce')}>Announce</a></li>
          <li><a onClick={ this.handleSubmit.bind(this, 'pass')}>Pass</a></li>
          <li className={!this.props.currentAnnounce || this.props.currentAnnounce.coincheEnabled?'':'hidden'}><a onClick={ this.handleSubmit.bind(this, 'coinche')}>Coinche</a></li>
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
  render: function(){
    var self=this;
    // console.log(self.props);
    var cards=this.props.cards.map(function(card,i) {
    // var cards=['AH','7S'].map(function(card,i) {
      return (
        <Card key={i} card={card} handlePlayCard={self.props.handlePlayCard} className={'cardToBePlayed ' + (self.props.playableCards.indexOf(card) != -1 ?'playableCard ':'')}/>
      );
    });
    return (
        <div className={'row mySpace'}>
            {cards}
        </div>
    )
  }
});

var Card = React.createClass({
  handlePlayCard: function(card){
    if (this.props.handlePlayCard)
      this.props.handlePlayCard(this.props.card)
  },
  render: function(){
    return (
      <img src={'/public/images/cards/' + this.props.card +'.png'} onClick={this.handlePlayCard} className={'card '+this.props.className}></img>
    );
      // <img src={'/public/images/cards/' + this.props.card.value + this.props.card.color +'.png'} className={'card '+this.props.className}></img>
  }
});
// #chatWindow 
//       ul#messages
//     #messageForm.hidden
//       form(action='')
//         input#messageInput(autocomplete='off')
//         button.hidden Send
var ChatWindow = React.createClass({
  getInitialState: function(){
    return ({messages:[]});
  },
  componentDidMount: function(){
    var self=this;
    socket.on('chat',function(data){
      self.state.messages.push(data);
      // self.state.messages.push({from:data.from,msg:data.msg});
      self.setState({messages:self.state.messages});
      //timer
      var delay = Math.min(Math.max(3000,data.msg.length*148),12000);
      setTimeout(function() {
        var index = self.state.messages.indexOf(data);
        self.state.messages.splice(index,1);
        self.setState({messages:self.state.messages});
      }, delay);
    });
  },
  render: function(){
    // var players = Object.keys(this.props.players).map(function(player, i) {
    var messages = this.state.messages.map(function(message, i) {
      return (
        <il key={i}>{message.from + ': ' + message.msg}</il>
      )
    });
      return(
        <div id="chatWindow">
          <ul>
            {messages}
          </ul>
        </div>
      )
    }
});
var ChatBar = React.createClass({
  getInitialState: function(){
    return ({hidden:true});
  },
  componentDidMount: function(){
    // alert('re');*
    var self = this;
    document.addEventListener('keypress', function(e){
      // alert(e);
      // var elem = $('#messageForm')
      if(e.which == 13) {//if it is enter;
        e.preventDefault();

          // $('#messageInput').focus();//TODO
        self.setState({hidden: !self.state.hidden});
        var messageInput = ReactDOM.findDOMNode(self.refs.messageInput);
        if(!self.state.hidden){
          messageInput.focus();
        } else {
          if (messageInput.value.trim()){
            self.handleSubmit(messageInput.value);
            messageInput.value = '';
          }
        }
              // if (elem.hasClass('hidden')){
              //   e.preventDefault();
              //   elem.removeClass('hidden');
              // } 
        // else {
          
        //   if (!$('#messageInput').is((":focus"))) e.preventDefault();
        //   elem.addClass('hidden');
        // }
      }
    });
  },
  handleSubmit: function(value){
    // alert('submit! '+val);

    socket.emit('chat',{msg:value});
  },
  render: function(){
    return(
      <form className={this.state.hidden?'hidden':''} action='' >
        <input ref='messageInput' id='messageInput' autocomplete='off' />
        <button className='hidden'>Send</button>
      </form>
    )
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