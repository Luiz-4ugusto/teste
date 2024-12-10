// Seleciona todos os parágrafos com a classe 'hover-target' e as divs correspondentes
const hoverTargets = document.querySelectorAll(".hover-target");
const hoverInfos = document.querySelectorAll(".hover-info");

// Função para atualizar a posição da div de informações
function moveInfo(e, infoDiv) {
  const offsetX = 15; // Distância em pixels do mouse
  const offsetY = 15;

  // Atualiza a posição da div de informações conforme o mouse
  infoDiv.style.left = e.pageX + offsetX + "px";
  infoDiv.style.top = e.pageY + offsetY + "px";
}

// Adiciona evento de 'mouseenter' e 'mousemove' nos parágrafos
hoverTargets.forEach((target, index) => {
  const infoDiv = hoverInfos[index];

  target.addEventListener("mouseenter", () => {
    infoDiv.style.display = "block"; // Mostra a div de informações ao passar o mouse
  });

  target.addEventListener("mousemove", (e) => {
    moveInfo(e, infoDiv); // Move a div conforme o movimento do mouse
  });

  target.addEventListener("mouseleave", () => {
    infoDiv.style.display = "none"; // Esconde a div quando o mouse sai do parágrafo
  });
});

// Inicializar
initializeGame();
let characters = [];

const images = [
  "imgs/bask.png",
  "imgs/foot.png",
  "imgs/surf.png",
  "imgs/tennis.png",
  "imgs/volei.png",
];
let currentIndex = 0;
const backgroundElement = document.querySelector(".background");

function changeBackground() {
  backgroundElement.classList.add("fade-out");
  setTimeout(() => {
    currentIndex = (currentIndex + 1) % images.length;
    backgroundElement.style.backgroundImage = `url(${images[currentIndex]})`;
    backgroundElement.classList.remove("fade-out");
  }, 500);
}

backgroundElement.style.backgroundImage = `url(${images[currentIndex]})`;
setInterval(changeBackground, 20000);

// Jogadores

async function fetchCharacters() {
  const response = await fetch("http://localhost:5000/characters");
  const characters = await response.json();
  return characters.map((character) => character.name);
}

async function initializeGame() {
  characters = await fetchCharacters();
}

// Verfica Chute

let tentativas = 0;
let clique = 0;
var dicas = false;

function gethints() {
  clique += 1;
  fetch("http://127.0.0.1:5000/characters/get-hint")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((character) => {
        let hintText = document.getElementById("hint_text");
        if (clique === 1) {
          dicas = true;
          hintText.innerHTML = `Dica 1: ${character.hint1}`;
        } else if (clique === 2) {
          dicas = true;
          hintText.innerHTML = `Dica 2: ${character.hint2}`;
        } else if (clique === 3) {
          dicas = true;
          hintText.innerHTML = `Dica 3: ${character.hint3}`;
        } else if (clique === 4) {
          dicas = true;
          hintText.innerHTML = `Apelido: ${character.nickname}`;
        } else if (clique === 5) {
          dicas = true;
          clique = 0;
        }
      });
    })
    .catch((error) => console.error("Erro:", error));
}

function clearCookies() {
  fetch("/clear_cookies")
    .then((response) => response.text())
    .then((script) => {
      let scriptElement = document.createElement("script");
      scriptElement.innerHTML = script;
      document.body.appendChild(scriptElement);
    });
}

function closePopup() {
  document.getElementById("myPopup").style.display = "none";
}

function openPopup(guess) {
  document.getElementById("myPopup").style.display = "block";
  let jogador_text = document.getElementById("jogador");
  let tentativas_text = document.getElementById("tentativas_popup");
  let hints_text = document.getElementById("hint_popup");

  jogador_text.textContent = guess;
  tentativas_text.textContent = `Acertou em: ${tentativas} Tentativas`;

  dicas = getLocalStorage(hints_text);

  if (dicas != NaN) {
    dicas = true;
  } else {
    dicas = false;
  }

  if (dicas === true) {
    hints_text.textContent = `Acertou usando Dicas`;
  } else {
    hints_text.textContent = `Acertou sem usar Dicas`;
  }
}

function openTutorial() {
  document.getElementById("tutorial").style.display = "block";
}

function closePopupTutorial() {
  document.getElementById("tutorial").style.display = "none";
}

function setLocalStorage(name, value) {
  localStorage.setItem(name, value);
}

function setLocalStorageHints(hint, value) {
  localStorage.setItem(hint, value);
}

function clearLocalStorage() {
  localStorage.clear();
}

function saveDivContents() {
  setTimeout(() => {
    const divs = document.querySelectorAll(".tentativa");
    const today = new Date().getDate();

    divs.forEach((div, index) => {
      div.setAttribute("data-index", index);
      div.setAttribute("data-date", today);
      const divContent = div.outerHTML;
      setLocalStorage(`divContent${index}`, divContent);
    });

    setLocalStorage("divCount", divs.length);
  }, 100);
}

function getLocalStorage(name) {
  return localStorage.getItem(name);
}

function loadDivContents() {
  const divCount = getLocalStorage("divCount");

  const divsArray = [];

  for (let i = 0; i < divCount; i++) {
    const today = new Date().getDate();
    const divContentString = getLocalStorage(`divContent${i}`);

    if (!divContentString) continue;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = divContentString;
    const divContent = tempDiv.firstElementChild;

    let date = divContent.getAttribute("data-date");

    if (date != today.toString()) {
      console.log(date);
      localStorage.removeItem(`divContent${i}`);
      continue;
    }

    divsArray.push(divContent);
  }

  divsArray.forEach((tempDiv) => {
    const tries_localStorage = tempDiv.querySelector(
      ".tentativa .try-message"
    ).textContent;
    submitGuess(tries_localStorage);
  });
}

function deleteLocalStorageAfterTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  console.log(`Hora atual: ${currentHour}:${currentMinute}`);

  if (currentHour === 10 && currentMinute === 43) {
    console.log("Hora de deletar os dados do localStorage");
    localStorage.clear();
    console.log("Dados do localStorage deletados após as 00:00");
  } else {
    console.log("Ainda não é hora de deletar os dados do localStorage");
  }
}

deleteLocalStorageAfterTime();
loadDivContents();

function submitGuess(guess) {
  fetch("http://localhost:5000/characters/verifyGuess", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ guess: guess }),
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("guess").value = "";
      let templateId = "error-template";
      const template = document.getElementById(templateId);
      const clone = document.importNode(template.content, true);

      tentativas++;
      document.getElementById(
        "tentativas"
      ).textContent = `Tentativas: ${tentativas}`;

      clone.querySelector(".try-message").textContent = `${guess}`;

      const sexDiv = clone.querySelector("#sex");
      if (data.sex) {
        sexDiv.style.background = "#1AEB31";
        sexDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/${data.sex_content}/v1/24px.svg')`;
        sexDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
        sexDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
        sexDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
      } else {
        sexDiv.style.background = "#E21919";
        sexDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/${data.sex_content}/v1/24px.svg')`;
        sexDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
        sexDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
        sexDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
      }

      const sportDiv = clone.querySelector("#sport");
      if (data.sport) {
        sportDiv.style.background = "#1AEB31";
        if (data.sport_content == "Futebol") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_soccer/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Tênis") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_tennis/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Basquete") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_basketball/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Vôlei") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_volleyball/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Surf") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/surfing/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        }
      } else {
        sportDiv.style.background = "#E21919";
        if (data.sport_content == "Futebol") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_soccer/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Tênis") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_tennis/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Basquete") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_basketball/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Vôlei") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/sports_volleyball/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        } else if (data.sport_content == "Surf") {
          sportDiv.style.backgroundImage = `url('https://fonts.gstatic.com/s/i/materialiconsoutlined/surfing/v1/24px.svg')`;
          sportDiv.style.backgroundSize = "contain"; // Ajusta o tamanho conforme necessário
          sportDiv.style.backgroundRepeat = "no-repeat"; // Evita que a imagem se repita
          sportDiv.style.backgroundPosition = "center"; // Centraliza a imagem na div
        }
      }

      const countryDiv = clone.querySelector("#country");
      if (data.country) {
        countryDiv.style.backgroundImage = `url('https://raw.githubusercontent.com/HatScripts/circle-flags/gh-pages/flags/${data.country_content}.svg')`;
        countryDiv.style.borderColor = "#1AEB31";
      } else {
        countryDiv.style.backgroundImage = `url('https://raw.githubusercontent.com/HatScripts/circle-flags/gh-pages/flags/${data.country_content}.svg')`;
        countryDiv.style.borderColor = "#E21919";
      }

      const statusDiv = clone.querySelector("#status");
      if (data.status) {
        statusDiv.style.background = "#1AEB31";
        if (data.status_content == "S") {
          statusDiv.textContent = "Ativo";
        } else {
          statusDiv.textContent = "Inativo";
        }
      } else {
        statusDiv.style.background = "#E21919";
        if (data.status_content == "S") {
          statusDiv.textContent = "Ativo";
        } else {
          statusDiv.textContent = "Inativo";
        }
      }

      const ageDiv = clone.querySelector("#age");
      const arrow = document.createElement("div");
      arrow.style.width = "0";
      arrow.style.height = "0";
      arrow.style.borderLeft = "5px solid transparent";
      arrow.style.borderRight = "5px solid transparent";


      // Condicional para o "age"
      if (data.age == "higher") {
        ageDiv.style.background =
          "linear-gradient(to bottom, #1AEB31, #E21919)";
        ageDiv.textContent = data.age_content;

        // Seta para cima
        arrow.style.borderBottom = "10px solid #FFFFFF"; // Define a seta para cima
        arrow.style.marginLeft = "3px";
        arrow.style.marginBottom = "3px";
        ageDiv.appendChild(arrow); // Adiciona a seta à div
      } else if (data.age == "lower") {
        ageDiv.style.background =
          "linear-gradient(to bottom, #E21919, #1AEB31)";
        ageDiv.textContent = data.age_content;

        // Seta para baixo
        arrow.style.borderTop = "10px solid #FFFFFF"; // Define a seta para baixo
        arrow.style.marginLeft = "3px"; // Afasta a seta do texto
        ageDiv.appendChild(arrow); // Adiciona a seta à div
      } else {
        ageDiv.style.background = "#1AEB31";
        ageDiv.textContent = data.age_content;

        // Se não for "higher" nem "lower", não adiciona seta
      }

      if (data.result) {
        console.log(data.result);
        saveDivContents();
        characters.splice(0, characters.length);
        openPopup(guess);
      } else {
        saveDivContents();
        const index = characters.indexOf(guess);
        characters.splice(index, 1);
      }

      document.getElementById("tries").appendChild(clone);
    })
    .catch((error) => console.error("Error:", error));
}

// Sugestões

function showSuggestions() {
  const input = document.getElementById("guess").value.toLowerCase();
  const suggestionsContainer = document.getElementById("suggestions");
  suggestionsContainer.innerHTML = "";

  if (input) {
    const filteredCharacters = characters.filter((character) =>
      character.toLowerCase().includes(input)
    );

    filteredCharacters.forEach((character) => {
      const suggestionDiv = document.createElement("div");
      suggestionDiv.className = "suggestion";
      suggestionDiv.textContent = character;
      suggestionDiv.onmousedown = () => {
        document.getElementById("guess").value = character;
        submitGuess(character);
        suggestionsContainer.innerHTML = "";
      };
      suggestionsContainer.appendChild(suggestionDiv);
    });
  }
}

function showAllSuggestions() {
  const suggestionsContainer = document.getElementById("suggestions");
  suggestionsContainer.innerHTML = "";

  if ((input = " ")) {
    characters.forEach((character) => {
      const suggestionDiv = document.createElement("div");
      suggestionDiv.className = "suggestion";
      suggestionDiv.textContent = character;
      suggestionDiv.onmousedown = () => {
        document.getElementById("guess").value = character;
        submitGuess(character);
        suggestionsContainer.innerHTML = "";
      };
      suggestionsContainer.appendChild(suggestionDiv);
    });
  }
}

function hideAllSuggestions() {
  const suggestionsContainer = document.getElementById("suggestions");
  suggestionsContainer.innerHTML = "";
}
