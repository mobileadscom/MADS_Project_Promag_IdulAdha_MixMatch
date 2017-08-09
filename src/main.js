/* global window */
import Mads from 'mads-custom';
import './main.css';

class AdUnit extends Mads {
  constructor() {
    super();

    this.step = 0;
  }

  render() {
    return `
      <div class="container" id="ad-container">
        <div id="page1" class="page">

        </div>
      </div>
    `;
  }

  style() {
    return [`
      #page1 {
        background: url(${this.data.bg1});
      }
      `];
  }

  events() {
    console.log('load events');
  }
}

window.ad = new AdUnit();
