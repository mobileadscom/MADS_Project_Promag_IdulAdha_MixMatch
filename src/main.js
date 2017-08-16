/* eslint-disable max-len */
/* global window, json_data */
import Mads, { fadeOutIn } from 'mads-custom';
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
      this.data[key] = typeof this.data[key] === 'string' && this.data[key].indexOf('.png') > -1 ? this.data[key].replace(/\s/g, '%20') : this.data[key];
    });

    return `
      <div class="container" id="ad-container">
        <div id="page1" class="page">
          <div id="mixMatchContainer"></div>
        </div>
        <div id="page2" class="page" style="display: none;">
          <form id="questionaire" class="form">
            <input type="text" placeholder="Nama *" required id="inputName">
            <input type="email" placeholder="Email *" required id="inputEmail">
            <input type="image" src="${this.data.btnSubmitImage}">
          </form>
        </div>
        <div id="page3" class="page" style="display: none;">
          <div id="social">
            <img src="${this.data.twit}" id="btnTwitter">
            <img src="${this.data.fb}" id="btnFacebook">
          </div>
          <img src="${this.data.btnSubmitImage}" id="btnInfo">
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
      #page2 {
        background: url(${this.data.bg2});
      }
      #page3 {
        background: url(${this.data.bg3});
      }
      `];
  }

  events() {
    if (!this.leadData) {
      if (typeof this.json === 'string' && (this.json.indexOf('./') === 0 || this.json.indexOf('https://') === 0 || this.json.indexOf('http://') === 0)) {
        this.loadJS(this.json).then(() => {
          this.leadData = {
            leadGenEle: json_data.leadGenEle,
          };
        });
      }
    }
    let submitting = false;
    this.elems.questionaire.addEventListener('submit', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (submitting) return;
      submitting = true;
      const inputs = [];
      const elements = this.leadData.leadGenEle.elements;
      const trackId = this.data.trackId || this.leadData.leadGenEle.leadGenTrackID;
      const userId = this.userId || 0;
      const studioId = window.data_studiofull.id || this.studioId || 0;
      const referredURL = encodeURIComponent(this.lead_tags || window.location.href);
      let ele = '';
      elements.forEach((element, index) => {
        inputs.push(this.elems[element.ele_id].value);
        ele += `{"fieldname":"${element.ele_name}","value":"${inputs[inputs.length - 1]}"}`;
        if (index !== elements.length - 1) {
          ele += ',';
        }
      });

      ele = encodeURIComponent(ele);

      const url = `https://www.mobileads.com/api/save_lf?contactEmail=${this.data.emails}&gotDatas=1&element=${ele}&user-id=${userId}&studio-id=${studioId}&tab-id=1&trackid=${trackId}&referredURL=${referredURL}&callback=leadGenCallback`;
      window.leadGenCallback = () => {
        console.log('leadgen callback called');
      };
      this.tracker('E', 'submit');
      this.loadJS(url).then(() => {
        console.log('done submission leadgen');
        fadeOutIn(this.elems.page2, this.elems.page3, {
          display: 'block',
        });
      });
    });
    this.elems.btnFacebook.addEventListener('mousedown', () => {
      this.tracker('E', 'facebook');
      const url = encodeURIComponent('http://www.mobileads.com/preview/?campaignId=e7ac28530858e771621fc0077feac354&studioId=3bf4c8d7416ea7a69efbf205a116f01a&adCategory=Interstitial&platform=MW&dimension=320x480');
      this.linkOpener(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
    });
    this.elems.btnTwitter.addEventListener('mousedown', () => {
      this.tracker('E', 'twitter');
      const referrer = encodeURIComponent('https://www.mobileads.com/');
      const msg = encodeURIComponent('message');
      const url = encodeURIComponent('http://www.mobileads.com/preview/?campaignId=e7ac28530858e771621fc0077feac354&studioId=3bf4c8d7416ea7a69efbf205a116f01a&adCategory=Interstitial&platform=MW&dimension=320x480');
      this.linkOpener(`https://twitter.com/intent/tweet?text=${msg}&original_referrer=${referrer}&url=${url}&tw_p=tweetbutton&via=mobileads`);
    });
    this.elems.btnInfo.addEventListener('mousedown', () => {
      this.tracker('E', 'info');
      this.linkOpener('http://google.com');
    });
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

          // this.match = 4;
          // this.opened.push(card);

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
            this.tracker('E', `match_${this.opened[0].className.replace('card ', '')}`);
            this.opened = [];
            this.match += 1;

            if (this.match >= 4) {
              this.tracker('E', 'match_complete');
              setTimeout(() => {
                fadeOutIn(this.elems.page1, this.elems.page2, {
                  display: 'block',
                });
              }, 2000);
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
