import { templates } from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(element, thisApp) {
    const thisHome = this;

    thisHome.render(element, thisApp);
  }
  render(wrapper, thisApp) {
    const thisHome = this;
    thisHome.dom = {};
    thisHome.dom.wrapper = wrapper;
    const generatedHTML = templates.homePage();
    const element = utils.createDOMFromHTML(generatedHTML);
    wrapper.appendChild(element);

    const order = thisHome.dom.wrapper.querySelector('a[href="#order"]');

    order.addEventListener('click', function () {
      thisApp.activatePage('order');
    });

    const booking = thisHome.dom.wrapper.querySelector('a[href="#booking"]');

    booking.addEventListener('click', function () {
      thisApp.activatePage('booking');
    });
  }
}

export default Home;