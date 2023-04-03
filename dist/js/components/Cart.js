import CartProduct from './CartProduct.js';
import {select, templates, classNames, settings} from '../settings.js';
import utils from '../utils.js';

class Cart {
  constructor(element){
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
    //thisCart.add();
  }

  getElements(element){
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;

    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
    thisCart.dom.totalPrice = element.querySelector(select.cart.totalPrice);
    thisCart.dom.totalMainPrice = element.querySelector(select.cart.totalMainPrice);
    thisCart.dom.form = element.querySelector(select.cart.form);
    thisCart.dom.address = element.querySelector(select.cart.address);
    thisCart.dom.phone = element.querySelector(select.cart.phone);
  }
  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct){
    const thisCart = this;

    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }
  update(){
    const thisCart = this;
    let deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
    for(let product of thisCart.products){
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }
    if(thisCart.totalNumber != 0){
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
    }
    else{
      thisCart.totalPrice = 0;
      deliveryFee = 0;
    }

    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    thisCart.dom.totalMainPrice.innerHTML = thisCart.totalPrice;

    console.log('delivery',deliveryFee);
    console.log('totalprice', thisCart.totalPrice);
    console.log('thisCart.totalNumber', thisCart.totalNumber);
    console.log('thisCart.subtotalPrice', thisCart.subtotalPrice);
  }
  remove(event){
    const thisCart = this;
            
    const indexOfProduct = thisCart.products.indexOf(event);
    const removedProduct = thisCart.products.splice(indexOfProduct, 1);
    console.log('removedProduct', removedProduct);

    event.dom.wrapper.remove();
    thisCart.update();
  }
  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      address: thisCart.dom.address.value,  //adres klienta wpisany w koszyku
      phone: thisCart.dom.phone.value,  //numer telefonu wpisany w koszyku
      totalPrice: thisCart.totalPrice,  //cena całkowita - koszt dostawy
      subtotalPrice: thisCart.subtotalPrice,  //całkowita cena za zamówienie
      totalNumber: thisCart.totalNumber,  //całkowita liczba sztuk
      deliveryFee: settings.cart.defaultDeliveryFee,  //koszt dostawy
      products: [],//tablica obecnych w koszyku produktów
    };
    console.log('payload', payload);

    for(let prod of thisCart.products){
      payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
      });
  }
}

export default Cart;