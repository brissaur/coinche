// playBoard
//       announceBoard
//         announceValue*
//         announceColor*
//         announceValidation*
//       TAPIS
//         card*
//       playerSpace
//         announce
//         dealer
//       mySpace
//         announce
//         cards*
// module.exports.PlayBoard = PlayBoard;
var PlayBoard = React.createClass({
  //props:
  //state: players[0...3]
  getInitialState: function(){
    return {
      players: [{name: 'a', announce:'80H', dealer:true, swapButton:true}, {name: 'b', announce:'', dealer:false, swapButton:false}, {name: 'c', announce:'', dealer:false, swapButton:false}, {name: 'd', announce:'', dealer:false, swapButton:false}],
      cards: [{value:'7',color:'H', playable:true}, {value:'9',color:'H', playable:true}, {value:'J',color:'H', playable:true}],
      playedCards: [{value:'7',color:'S', playable:true}, {value:'9',color:'S', playable:true}],
      currentAnnounce: {value:'100',color:'AT'}

    };
  },
  handleAnnounce: function(){
    alert('announce');
  },
  render: function(){
    var PlayersSpace = this.state.players.map(function(player) {
      return (
        <PlayerSpace playerSpace={player}/>
      );
    });
    return(
      <div>
        <AnnounceBoard currentAnnounce={this.state.currentAnnounce} handleAnnounce={this.handleAnnounce}/>
        <Tapis cards={this.state.playedCards}/>
        {PlayersSpace}
        <MySpace cards={this.state.cards}/>
      </div>
    )
  }
});
var PlayerSpace = React.createClass({
  render: function(){
    return (
      <div id={'playerSpace' + this.props.playerSpace.name}>
        <p> {this.props.playerSpace.name} </p>
        <div id={'announce' + this.props.playerSpace.name}>{this.props.playerSpace.announce}</div>
        <div id={'dealer' + this.props.playerSpace.name} className={this.props.playerSpace.dealer?'':'hidden'}>D</div>
        <button className={this.props.playerSpace.swapButton?'':'hidden'}>Swap Place</button>
      </div>
    )
  }
});
var AnnounceBoard = React.createClass({
  render: function(){
    var availableAnnounce = [80,90,100,110,120,130,140,150,160,170,250,270];
    var currentAnnounceVal=this.props.currentAnnounce.value;
    var possibleAnnounces=availableAnnounce.map(function(value) {
    if (value>currentAnnounceVal){
        return (
          <li><a>{value}</a></li>
        );
      } else {
        return null;
      }
    });
    return (
      <div id='announceBoard'>
        <ul>
          {possibleAnnounces}
        </ul>
        <ul>
          <li><a>H</a></li>
          <li><a>S</a></li>
          <li><a>D</a></li>
          <li><a>C</a></li>
          <li><a>AT</a></li>
          <li><a>NT</a></li>
        </ul>
        <ul>
          <li><a>Announce</a></li>
          <li><a>Pass</a></li>
          <li><a>Coinche</a></li>
        </ul>

      </div>
    )
  }
});
var Tapis = React.createClass({
  //TODO: gérer le positionement (north est west south)
    
  render: function(){
    var cards=this.props.cards.map(function(card) {
      return (
        <Card card={card} className='playedCard'/>
      );
    });
    return (
      <div id='tapis'>
        {cards}
      </div>
    )
  }
});
var MySpace = React.createClass({
  render: function(){
    var Cards=this.props.cards.map(function(card) {
      return (
        <Card card={card} className='cardToBePlayed'/>
      );
    });
    return (
      <div id='mySpace'>
        {Cards}
      </div>
    )
  }
});
var Card = React.createClass({
  render: function(){
    return (
      <img src={'img/cards/' + this.props.card.value + this.props.card.color +'.png'} className={'card '+this.props.className}></img>
    );
  }
});
ReactDOM.render(
  <div>
    <PlayBoard />
  </div>,
  document.getElementById('example')
);