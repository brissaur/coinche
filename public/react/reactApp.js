var socket = io();
// console.log(socket);

var CoincheApp = React.createClass({
  getInitialState: function(){
    return {youInviteThem: true, playersToInvite:[], playBoard: true, 
      peopleInRoom:[{},{},{},{}], inRoom: false, inGame: false,
      theyInviteYou: false, inviteFrom: null}
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
      self.setState({peopleInRoom: context.players, inRoom: true});
    });
    socket.on('join',function(data){
      if (data.accept) {
        self.setState({peopleInRoom: data.players});
      } else {
        console.log('SYSTEM: ' + data.from +' did not join the room');
      }
    });
    socket.on('leaveRoom', function(data){
      console.log('SYSTEM: ' + data.from + ' left the room');
      self.setState({peopleInRoom:data.players});
    });
    socket.on('updateStatus', function(data){//todo: degueu...
        var players = self.state.playersToInvite;
        if (players[data.from]){
          players[data.from].status=data.status;
          self.setState({playersToInvite:players});
        }
    });
    socket.on('swap', function(data){
      self.setState({peopleInRoom:data.players});

    });
    socket.on('startEnabled', function(data){
      self.setState({startButton:true});
    });
    socket.on('startDisabled', function(data){
      self.setState({startButton:false});
    });
    socket.on('startGame', function(data){
      console.log('SYSTEM: starting Game...');
      self.setState({inGame:true});
    });

    socket.on('updatePlayerInfo', function(data){
      self.setState({peopleInRoom: data.players});
    });

    socket.on('roomInvitation', function(data){
      console.log("roomInvitation");
        self.setState({theyInviteYou:true, inviteFrom:data.from});
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
  handleAcceptInvitation: function(accept){
      this.setState({theyInviteYou: false, inviteFrom:null});
      socket.emit('acceptInvite',{accept:accept});
  },
  render: function(){
    var youInviteThem = this.state.youInviteThem ? <YouInviteThem inGame={this.state.inGame} players={this.state.playersToInvite}/> : null;
    var playBoard = this.state.playBoard ? <PlayBoard inGame={this.state.inGame} inRoom={this.state.inRoom} players={this.state.peopleInRoom} leaveRoom={this.handleLeaveRoom}/> : null;
    var startButton = this.state.startButton ? <button onClick={this.handleStartGame} className={'startGame '}>Start Game</button> : null;
    var theyInviteYou = this.state.theyInviteYou ? <TheyInviteYou inviteFrom={this.state.inviteFrom} handleAcceptInvitation={this.handleAcceptInvitation}/> : null;
    return (
      <div id='AppROOT'>
        {youInviteThem}
        {theyInviteYou}
        {playBoard}
        {startButton}
        <ChatWindow />
        <ChatBar />
      </div>
    );
  }
});
var TheyInviteYou = React.createClass({ //OK
    render: function(){
      return (
        <div className={'theyInviteYou'}>
          <div> {this.props.inviteFrom} invited you to join his room!</div>
          <button onClick={this.props.handleAcceptInvitation.bind(null,true)}>Accept</button>
          <button onClick={this.props.handleAcceptInvitation.bind(null,false)}>Refuse</button>
        </div>
     )
    }
  });
  var YouInviteThem = React.createClass({
    getInitialState: function() {
      return {inviteFriends: true,  inviteFriendsBoard:false, playersToInvite: []};
    },
    handleInviteFriends: function() {
      this.setState({inviteFriends: false,  inviteFriendsBoard:true});
    },
    handleSendFriendInvitation: function(){
      console.log('invitation sent to ' + this.state.playersToInvite);
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
      var inviteFriendsButton = !this.props.inGame && this.state.inviteFriends?<button id="inviteFriendsButton" type='button' onClick={this.handleInviteFriends}> Invite Friends For A Game</button> : null;
      var inviteFriendsBoard = this.state.inviteFriendsBoard ? 
                              <div id="inviteFriendsBoard" >
                                <ul> {players}</ul>
                                <button onClick={this.handleSendFriendInvitation}>Invite</button>
                                <button onClick={this.cancelFriendInvitation}>Cancel</button>
                              </div>
                              : null;
      return (
        <div className={'youInviteThem ' + this.props.className }>
          {inviteFriendsButton}
          {inviteFriendsBoard}
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
  getInitialState: function(){
    return { mustAnnounce: false, currentAnnounce: null,myCards: [],myTurnToPlay: false, 
      playableCards:[], playedCards:[], scores:{round:[null,null],game:[0,0]}, 
      belote:null, winningCardIndex:null};
  },
  componentDidMount: function(){
    var self = this;
    var DISPLAYDELAY = 30000;
    // var DISPLAYDELAY = 30;
    socket.on('announce', function(data){
      setTimeout(function() {
        self.setState({mustAnnounce:true, currentAnnounce:data.announce});
      }, self.getNbPlayedCards() == 4 ? DISPLAYDELAY : 0);
    });
    socket.on('announced', function(data){
    });
    socket.on('distribute', function(data){
      setTimeout(function() {
        self.setState({myCards:data.cards});
      }, self.getNbPlayedCards() == 4 ? DISPLAYDELAY : 0);
    });
    socket.on('play', function(data){
      setTimeout(function() {
        self.setState({ myTurnToPlay: true, playableCards:data.cards });
      }, self.getNbPlayedCards() == 4 ? DISPLAYDELAY : 0);
    });
    socket.on('endTrick', function(data){
      self.setState({winningCardIndex:data.index});
      setTimeout(function() {
        self.setState({playedCards:[],winningCardIndex:null});
      }, DISPLAYDELAY);
    });
    socket.on('endJetee', function(data){
      console.log('endJetee');
      self.setState({scores:data.scores})
    });
    socket.on('updateScores', function(data){
      self.setState({scores:data.scores})
    });
    socket.on('played', function(data){
      self.state.playedCards[data.index] = data.card;
      self.setState({playedCards:self.state.playedCards});//todo: cleaner to reset state
    });
    socket.on('belote', function(data){
      console.log({belote:data});
      self.setState({belote:{player: data.index, value:(data.rebelote?'RE':'')+'BELOTE'}});
      setTimeout(function() {
        self.setState({belote:null});
      }, DISPLAYDELAY); //TODO: change delay
    });
    socket.on('coinche', function(data){
      //TODO: AMAZING annimation for coinched
      alert(data.from + ' coinched !!!!');
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
    if (this.state.playableCards.indexOf(card)!=-1){
      this.setState({playableCards:[], myTurnToPlay: false});
      socket.emit('play',{card:card});
      this.state.myCards.splice(this.state.myCards.indexOf(card),1);
    }
  },
  render: function(){
    var scores = this.props.inGame ? <Scores scores={this.state.scores}/>:null;
    var announceBoard = this.state.mustAnnounce ? <AnnounceBoard className='col-xs-6' currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>:null;
    var playedCardBoard = this.state.mustAnnounce ? null : <PlayedCardsBoard playedCards={this.state.playedCards} winningIndex={this.state.winningCardIndex}/>;
    var leaveRoomButton = this.props.inRoom ? <button onClick={this.handleLeaveRoom} className='leaveRoom '>Leave Room</button> : null;
    var belote = this.state.belote;
    return(
      <div className={'playBoard '}>
        <div className={'playBoardContainer'}>
          <div className={'row'} style={{flex:'1'}}>
            <div className='col-xs-4'>
              {scores}
            </div> 
            <div className='col-xs-4' >
              <PlayerSpace inGame={this.props.inGame} place='NORTH' playerIndex={2} player={this.props.players[2]} belote={belote?(belote.player==2?(belote.value):null):null} />
            </div>
          </div>
          <div className={'row centerRow'} style={{flex:'5'}}>
            <div className='col-xs-3' >
              <PlayerSpace inGame={this.props.inGame} place='WEST' playerIndex={1} player={this.props.players[1]} belote={belote?(belote.player==1?(belote.value):null):null} />
            </div>
            {playedCardBoard}
            {announceBoard}
            <div className={'col-xs-3'} >
              <PlayerSpace inGame={this.props.inGame} place='EAST' playerIndex={3} player={this.props.players[3]} belote={belote?(belote.player==3?(belote.value):null):null} />
            </div>
          </div>
          <div className={'row'} style={{flex:'1'}}>
            <div className='col-xs-4' >
              <PlayerSpace myTurnToPlay={this.state.myTurnToPlay} inGame={this.props.inGame} place='SOUTH' playerIndex={0} player={this.props.players[0]} belote={belote?(belote.player==0?(belote.value):null):null}/>
            </div>
          </div>
          <MySpace handlePlayCard={this.handlePlayCard} cards={this.state.myCards} playableCards={this.state.playableCards}/>
        </div>
        {leaveRoomButton}
      </div>
    )
  }
});
var Scores = React.createClass({
  render: function(){
    return(
      <table id='scores' className={this.props.className}>
        <thead>
          <tr>
            <th></th>
            <th>Us</th>
            <th>Them</th>
          </tr>
        </thead>
        <tbody>
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
        </tbody>
      </table>
    )
  }
});
var PlayedCardsBoard = React.createClass({
  render: function(){
    var positions = ["bottom","left","top","right"];
    var self=this;
    if (this.props.winningCard != null)
      console.log('ROOOOOOOOOOOOO');
    console.log(this.props);
    var cards=this.props.playedCards.map(function(card,i) {
      return(
        <Card key={i} card={card} className={"playedCard " + positions[i]+ (self.props.winningIndex == i ? " winningCard" : "")}/>
      )
    });
    return(
        <div className={'col-xs-6'} id='playedCardsBoard'>
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
    var displayColors = {'H':'♥','S':'♠','C':'♣','D':'♦','AT':'AT','NT':'NT'};
    var myTurnToPLay = this.props.myTurnToPLay ? <span>Your turn to play!</span> : null;
    var announce = this.props.player.announce ? <span>{'Announce:' + (this.props.player.announce.value==0?'Pass':this.props.player.announce.value + displayColors[this.props.player.announce.color])}</span> : null
    var dealer = this.props.player.dealer ? <span className={'dealer '}>D</span> : null;
    var swapPlace = this.props.playerIndex==0||this.props.inGame ? null : <button onClick={this.handleSwap.bind(this, this.props.playerIndex)}>Swap Place</button>;
    var belote = this.props.belote?<span>{this.props.belote}</span>:null;
    var res = this.props.player.name ? <div id={this.props.place} className={'playerSpace ' + (this.props.className?this.props.className:null)}>
                                        {myTurnToPLay}
                                        {announce}
                                        {dealer}
                                        {belote}
                                        <span> {this.props.place} : {this.props.player.name} </span>
                                        {swapPlace}
                                      </div>
                                      : null;
    return (
     res
    )
  }
});

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
    var coinche = this.props.currentAnnounce.coincheEnabled ? <li><a onClick={ this.handleSubmit.bind(this, 'coinche')}>Coinche</a></li> : null;
    return (
      <div className={'announceBoard ' + this.props.className} id='announceBoard'>
        <ul className='list-inline'>
          {possibleAnnounces}
        </ul>
        <ul className='list-inline'>
          <li><a onClick={ this.selectColor.bind(this, 'H') } className={'announce ' + (this.state.color == 'H'?'selected':'')} style={{color:'red'}}>♥</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'S') } className={'announce ' + (this.state.color == 'S'?'selected':'')} style={{color:'black'}}>♠</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'D') } className={'announce ' + (this.state.color == 'D'?'selected':'')} style={{color:'red'}}>♦</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'C') } className={'announce ' + (this.state.color == 'C'?'selected':'')} style={{color:'black'}}>♣</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'AT') } className={'announce ' + (this.state.color == 'AT'?'selected':'')}>AT</a></li>
          <li><a onClick={ this.selectColor.bind(this, 'NT') } className={'announce ' + (this.state.color == 'NT'?'selected':'')}>NT</a></li>
        </ul>
        <ul className='list-inline'>
          <li><a onClick={ this.handleSubmit.bind(this, 'announce')}>Announce</a></li>
          <li><a onClick={ this.handleSubmit.bind(this, 'pass')}>Pass</a></li>
          {coinche}
        </ul>

      </div>
    )
  }
});

var MySpace = React.createClass({
  render: function(){
    var self=this;
    var cards=this.props.cards.map(function(card,i) {
      return (
        <Card key={i} card={card} handlePlayCard={self.props.handlePlayCard} className={'cardToBePlayed ' + (self.props.playableCards.indexOf(card) != -1 ?'playableCard ':'')}/>
      );
    });
    return (
      <div className={'row mySpace'} style={{flex:'2'}}>
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
  }
});

var ChatWindow = React.createClass({
  getInitialState: function(){
    return ({messages:[]});
  },
  componentDidMount: function(){
    var self=this;
    socket.on('chat',function(data){
      self.state.messages.push(data);
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
    var self = this;
    document.addEventListener('keypress', function(e){
      if(e.which == 13) {//if it is enter;
        e.preventDefault();
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
      }
    });
  },
  handleSubmit: function(value){
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