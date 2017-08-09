/* eslint-disable max-len */
/* global window */
import Mads from 'mads-custom';
import './main.css';

const getDuplicates = (arr) => {
  const duplicates = {};
  for (let i = 0; i < arr.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(duplicates, arr[i])) {
      duplicates[arr[i]].push(i);
    } else if (arr.lastIndexOf(arr[i]) !== i) {
      duplicates[arr[i]] = [i];
    }
  }
  return duplicates;
};

const designFn = (elem, cssText) => {
  const pattern = /([\w-]*)\s*:\s*([^;]*)/g;
  let match;
  const props = {};
  while (match = pattern.exec(cssText)) { // eslint-disable-line
    props[match[1]] = match[2];
    elem.style[match[1]] = match[2]; // eslint-disable-line
  }
};

class AdUnit extends Mads {
  constructor() {
    super();

    this.page = 1;
    this.matrix = [];
    this.cards = ['cow', 'goat', 'logo', 'sheep'];
    this.design = designFn;
  }

  render() {
    Object.keys(this.data).forEach((key) => {
      this.data[key] = this.data[key].indexOf('.png') > -1 ? this.data[key].replace(/\s/g, '%20') : this.data[key];
    });

    return `
      <div class="container" id="ad-container">
        <div id="page1" class="page">
          <img src="${this.data.ayoDonasi}" title="ayo-donasi" id="ayoDonasi" />
          <img src="${this.data.mainGamenya}" title="main-gamenya" id="mainGamenya" />
          <div id="mixMatchContainer"></div>
        </div>
      </div>
    `;
  }

  postRender() {
    this.game = this.initMixMatch({});
  }

  style() {
    return [`
      #page1 {
        background: url(${this.data.bg1});
      }
      `];
  }

  events() {
    setTimeout(() => {
      this.elems.ayoDonasi.className = 'blur-out';
      this.elems.mainGamenya.className = 'blur-in';
    }, 1000);
  }

  initMixMatch(opts) {
    const row = opts.row || 2;
    const col = opts.col || 4;
    const container = this.elems.mixMatchContainer;
    this.disableAll = false;
    this.opened = [];
    this.match = 0;

    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - (min + 1))) + min;

    const getMatrix = (matrix) => {
      const mat = matrix || [];
      const total = mat.length;
      const i = getRandomInt(0, 5);

      if (total < 8) {
        mat.push(this.cards[i]);
        const d = getDuplicates(mat)[this.cards[i]];
        if (d && d.length >= 3) {
          mat.pop();
        }
        return getMatrix(mat);
      }
      return mat;
    };

    const matrix = getMatrix();
    let indexM = 0;
    for (let i = 0; i < row; i += 1) {
      for (let j = 0; j < col; j += 1) {
        const card = window.document.createElement('div');
        const cardId = `card_row${i}_col${j}`;
        card.style.left = `${(80 * j) + 3}px`;
        card.style.top = `${(80 * i) + 3}px`;
        card.className = `card ${matrix[indexM]}`;
        card.innerHTML = `<img id="${cardId}_front" class="front" style="transform:rotateY(0deg)" src="${this.data.front}" />
          <img id="${cardId}_back" style="transform:rotateY(180deg)" class="back" src="${this.data[matrix[indexM]]}" />`;
        card.addEventListener('mousedown', (e) => {
          if (this.disableAll) {
            e.stopPropagation();
            e.preventDefault();
            return false;
          }

          card.style.transform = 'translateX(75.5px) rotateY(180deg)';
          this.design(card, `-webkit-transform:${card.style.transform}`);

          this.opened.push(card);

          if (this.opened.length === 2 && this.opened[0].className !== this.opened[1].className) {
            this.disableAll = true;
            setTimeout(() => {
              this.opened[0].style.transform = 'rotate(0deg)';
              this.opened[1].style.transform = 'rotate(0deg)';
            }, 1000);
            setTimeout(() => {
              this.disableAll = false;
              this.opened = [];
            }, 1200);
          } else if (this.opened.length === 2 && this.opened[0].className === this.opened[1].className) {
            this.opened = [];
            this.match += 1;

            if (this.match >= 4) {
              // done
            }
          }

          return true;
        });
        container.appendChild(card);
        indexM += 1;
      }
    }
    this.matrix = matrix;
  }
}

window.ad = new AdUnit();
