
//Card game

class CardGame {

  constructor() {
    this.isNormalGame = true;
    this.numberOfCards = 1;
  }

  #player1Cards = document.querySelector(".section1");
  #player2Cards = document.querySelector(".section2");
  #resultText = document.querySelector("#result");
  #player1Score = document.querySelector("#p1score");
  #player2Score = document.querySelector("#p2score");

  saveToLocalStorage() {
    if(!localStorage.gameId) {
      localStorage.setItem("gameId", "")
      this.fetchDeckId();
    }
    if(!localStorage.player1Score) {
      localStorage.setItem("player1Score", 0);
      localStorage.setItem("player2Score", 0);
    }
    this.#player1Score.innerText = `Player 1 score: ${localStorage.getItem("player1Score")}`;
    this.#player2Score.innerText = `Player 2 score: ${localStorage.getItem("player2Score")}`;

    if(localStorage.getItem("image1")) {
      document.querySelector("#player1").src = localStorage.image1;
      document.querySelector("#player2").src = localStorage.image2;
    }
  }


  
  fetchDeckId() {
    return fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1") //you have to have a "return" here because of the await keyword in drawTwoCards!
    .then(res =>  {
      if(!res.ok) {
        console.log(res.error)
      }
      return res.json();
    })
    .then(data => {
      localStorage.gameId = data.deck_id;

    })
    .catch(err => {
        console.log(`error ${err}`)
    });
 }

 handleGameMode() {
  if (this.isNormalGame) {
    newGame.drawTwoCards();
  } else {
    newGame.warGame();
  }
}

  async drawTwoCards(){

    console.log("JUST A NORMAL GAME")

    this.removeCards();

    if(!localStorage.gameId) {
      await this.fetchDeckId();
    }

    const url = `https://deckofcardsapi.com/api/deck/${localStorage.gameId}/draw/?count=2`

      return fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log(data, "TWOCARDS DATA")

          document.querySelector("#player1").src = data.cards[0].image;
          document.querySelector("#player2").src = data.cards[1].image;

          localStorage.setItem("image1", data.cards[0].image);
          localStorage.setItem("image2", data.cards[1].image);
          

          const player1Val = this.convertToNum(data.cards[0].value);
          const player2Val = this.convertToNum(data.cards[1].value);

          if(player1Val > player2Val) {
            this.#resultText.innerText = "Player 1 WON";
            this.addToPlayer1Pile(`${data.cards[0].code},${data.cards[1].code}`);

          } else if(player2Val > player1Val) {
            this.#resultText.innerText = "Player 2 WON";
            this.addToPlayer2Pile(`${data.cards[0].code},${data.cards[1].code}`);

          } else {
            this.#resultText.innerText = "This means WAR!";
            this.isNormalGame = false;
            this.addToTempPile(`${data.cards[0].code},${data.cards[1].code}`);
          }

        })
        .catch(err => {
            console.log(`error ${err}`)
        });
  }

  resetGame() {
    localStorage.removeItem("gameId");
    localStorage.removeItem("player1Score");
    localStorage.removeItem("player2Score");
    localStorage.removeItem("image1");
    localStorage.removeItem("image2");

    document.querySelector("#player1").src = "img/backOfCard.png"
    document.querySelector("#player2").src = "img/backOfCard.png"

    this.#player1Score.innerText = "Player 1 score: 0"
    this.#player2Score.innerText = "Player 2 score: 0"
    this.#resultText.innerText = "Who will win?"

    this.isNormalGame = true;
    this.removeCards();
  }

  convertToNum(val) {
    switch (val) {
      case "ACE":
        return 14;
      case "KING":
        return 13;
      case "QUEEN":
        return 12;
      case "JACK":
        return 11;
      default: 
        return Number(val);
    }
  }

  async addToPlayer1Pile(card) {

    const url = `https://deckofcardsapi.com/api/deck/${localStorage.gameId}/pile/pile1/add/?cards=${card}`

    await fetch(url)
        .then(res => res.json()) 
        .then(data => {
          console.log(data, "ADD TO PILE 111")
          this.setPlayersScore(data);
          this.whoWon(data);
        })
        .catch(err => {
            console.log(`error ${err}`)
        });
    
  }

  async addToPlayer2Pile(card) {

    const url = `https://deckofcardsapi.com/api/deck/${localStorage.gameId}/pile/pile2/add/?cards=${card}`

    await fetch(url)
        .then(res => res.json()) 
        .then(data => {
          console.log(data, "ADD TO PILE 222")
          this.setPlayersScore(data);
          this.whoWon(data);
        })
        .catch(err => {
            console.log(`error ${err}`)
        });
    
  }

  async addToTempPile(card) {
    const url = `https://deckofcardsapi.com/api/deck/${localStorage.gameId}/pile/tempPile/add/?cards=${card}`

    await fetch(url)
        .then(res => res.json()) 
        .then(data => {
          this.whoWon(data);
          console.log(data, "ADD TO PILE TEMP")
        })
        .catch(err => {
            console.log(`error ${err}`)
        });
    
  }

  async moveCardsToWinnerPile(winningPlayer) {

    let cardsInTempPile = [];


    await fetch(`https://deckofcardsapi.com/api/deck/${localStorage.gameId}/pile/tempPile/list/`)
    .then((res) => res.json())
    .then((data) => {
      console.log(data, "MOVE TO WINNER DATA: GET LIST");
      data.piles.tempPile.cards.forEach(card => cardsInTempPile.push(card.code));
    })
    .catch((err) => {
      console.log(`error ${err}`);
    });


    console.log(cardsInTempPile, "cards in tempPile")

    const url = `https://deckofcardsapi.com/api/deck/${localStorage.gameId}/pile/${winningPlayer}/add/?cards=${cardsInTempPile.join()}`;
  
    await fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data, "MOVE TO WINNER DATA: MOVE CARDS");
        this.setPlayersScore(data);
        this.whoWon(data);
      })
      .catch((err) => {
        console.log(`error ${err}`);
      });

      cardsInTempPile = [];
  }

  async warGame() {

    console.log("THIS MEAN WAR!!!");

    if(!localStorage.gameId) {
      await this.fetchDeckId();
    }

    this.#resultText.innerText = "WAR";

    const url = `https://deckofcardsapi.com/api/deck/${localStorage.gameId}/draw/?count=2`

      return fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log(data, "war DATA")

          const newCardPlayer1 = document.createElement("img");
          const newCardPlayer2 = document.createElement("img");

          this.#player1Cards.appendChild(newCardPlayer1);
          this.#player2Cards.appendChild(newCardPlayer2);

          this.#player1Cards.lastChild.src = data.cards[0].image;
          this.#player2Cards.lastChild.src = data.cards[1].image;

          ++this.numberOfCards;

          this.addToTempPile(`${data.cards[0].code},${data.cards[1].code}`);

          if(this.numberOfCards % 3 === 0) {
            const player1Val = this.convertToNum(data.cards[0].value);
            const player2Val = this.convertToNum(data.cards[1].value);

              if(player1Val > player2Val) {
                  this.#resultText.innerText = "Player 1 WON won the WAR!";
                  this.numberOfCards = 1;
                  this.isNormalGame = true;
                  this.moveCardsToWinnerPile("pile1");


              } else if(player2Val > player1Val) {
                  this.#resultText.innerText = "Player 2 WON the WAR!";
                  this.numberOfCards = 1;  
                  this.isNormalGame = true;
                  this.moveCardsToWinnerPile("pile2");

              } else {
                  this.#resultText.innerText = "This means WAR!, again.";
              }
          }
        })
        .catch(err => {
            console.log(`error ${err}`)
        });
    }

    setPlayersScore(data) {
      if(!localStorage.player1Score) {
        localStorage.setItem("player1Score", 0);
        localStorage.setItem("player2Score", 0);
      } 

      const player1Remaining = data.piles.pile1?.remaining ?? 0;
      const player2Remaining = data.piles.pile2?.remaining ?? 0;
    
      console.log("Player 1 score in setPlayersScore:", player1Remaining);
      console.log("Player 2 score in setPlayersScore:", player2Remaining);
    
      localStorage.player1Score = player1Remaining;
      localStorage.player2Score = player2Remaining;
    
      this.#player1Score.innerText = `Player 1 score: ${player1Remaining}`;
      this.#player2Score.innerText = `Player 2 score: ${player2Remaining}`;
    }

    removeCards() {
      while(this.#player1Cards.childElementCount > 2) {
        this.#player1Cards.removeChild(this.#player1Cards.lastChild);
       }
      while(this.#player2Cards.childElementCount > 2) {
      this.#player2Cards.removeChild(this.#player2Cards.lastChild);
       }

    }

    whoWon(data) { // daj v add to player pile in moveCardsToWinnerPile
      if(data.remaining <= 0) {
        if(data.piles.pile1.remaining > data.piles.pile2.remaining) {
          this.#player1Score.innerText = `Player 1 WON the game with ${localStorage.getItem("player1Score")} points!`
          this.#player2Score.innerText = `Player 2 LOST the game with ${localStorage.getItem("player2Score")} points!`
        } else if (data.piles.pile1.remaining < data.piles.pile2.remaining) {
          this.#player1Score.innerText = `Player 1 LOST the game with ${localStorage.getItem("player1Score")} points!`
          this.#player2Score.innerText = `Player 2 WON the game with ${localStorage.getItem("player2Score")} points!`
        } else {
          this.#player1Score.innerText = "It's a tie!"
          this.#player2Score.innerText = "It'a tie!"
        }
       }
    }
    
  }

const newGame = new CardGame("game");

newGame.saveToLocalStorage();

document.querySelector('#play').addEventListener('click', newGame.handleGameMode.bind(newGame));

document.querySelector("#player1").addEventListener('click', newGame.handleGameMode.bind(newGame));
document.querySelector("#player2").addEventListener('click', newGame.handleGameMode.bind(newGame));

document.querySelector("#reset").addEventListener("click", () => {
  newGame.resetGame();
})



/* 
//Card game

let deckId = "";

fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
.then(res => res.json()) // parse response as JSON
.then(data => {
  console.log(data)
  deckId = data.deck_id;
  console.log(deckId)

})
.catch(err => {
    console.log(`error ${err}`)
});

document.querySelector('button').addEventListener('click', drawTwo)

function drawTwo(){
  
  const url = `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`

  fetch(url)
      .then(res => res.json()) // parse response as JSON
      .then(data => {
        console.log(data)
        document.querySelector("#player1").src = data.cards[0].image;
        document.querySelector("#player2").src = data.cards[1].image;
        const player1Val = convertToNum(data.cards[0].value);
        const player2Val = convertToNum(data.cards[1].value);

        const resultText = document.querySelector("#result");

        if(player1Val > player2Val) {
          resultText.innerText = "Player 1 WON";
        } else if(player2Val > player1Val) {
          resultText.innerText = "Player 2 WON";
        } else {
          resultText.innerText = "This means WAR!"
        }

      })
      .catch(err => {
          console.log(`error ${err}`)
      });
}

function convertToNum(val) {
  switch (val) {
    case "ACE":
      return 14;
    case "KING":
      return 13;
    case "QUEEN":
      return 12;
    case "JACK":
      return 11;
    default: 
      return Number(val);
  }
} */

