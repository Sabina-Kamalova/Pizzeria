import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element){
    const thisBooking = this;
    thisBooking.selectedTables = [];
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

    
  }

  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);


    const params = {
      bookings: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    //console.log('GetData params:', params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.bookings
                                     + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events
                                     + '?' + params.eventsRepeat.join('&'), 
    };
    //console.log('GetData urls:', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrent = allResponses[1];
        const eventsRepeat = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrent.json(),
          eventsRepeat.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log('bookings', bookings);
        //console.log('eventsCurrent', eventsCurrent);
        //console.log('eventsRepeat', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
    
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1))
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
      }
    }
    console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);
    
    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock]= [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    } 
  }
  
  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    for(let table of thisBooking.dom.tables){
      if(table.classList.contains(classNames.booking.selected)){
        table.classList.remove(classNames.booking.selected);
        thisBooking.selectedTables.pop();
      }
    }
  }

  render(element){
    const thisBooking = this;
    /* generate HTML based on template */
    const generatedHTML = templates.bookingWidget();
    
    thisBooking.dom ={};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.allTables = thisBooking.dom.wrapper.querySelector(select.booking.allTables);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    //thisBooking.dom.datePicker.input = element.querySelector(select.widgets.datePicker.input);
    thisBooking.dom.people = element.querySelector(select.booking.ppl);
    thisBooking.dom.duration = element.querySelector(select.booking.duration);
    //thisBooking.dom.date = element.querySelector(select.widgets.datePicker.input);
    //thisBooking.dom.hour = element.querySelector(select.widgets.hourPicker.input);
    thisBooking.dom.starters = element.querySelectorAll(select.booking.starters);
  }

  initTables(event){
    const thisBooking = this;
    
    event.preventDefault();
    const clickedTable = event.target;
    console.log('clickedTable', event.target);

    if(clickedTable.classList.contains(classNames.booking.table)){
      const tableData = clickedTable.getAttribute(settings.booking.tableIdAttribute);
        
      if(clickedTable.classList.contains(classNames.booking.tableBooked)){
        alert('This table is booked! Choose another one ;)');
      } else{
        for(let table of thisBooking.dom.tables){
          if(table.classList.contains(classNames.booking.selected) &&
            table != clickedTable){
            table.classList.remove(classNames.booking.selected);
            thisBooking.selectedTables.pop();
            
          }
          clickedTable.classList.toggle(classNames.booking.selected);
          if(clickedTable.classList.contains(classNames.booking.selected)){
            thisBooking.selectedTables.push(tableData);
          } else {
            thisBooking.selectedTables.splice(thisBooking.selectedTables.indexOf(tableData), 1);
          }
        }
      }
      console.log('dataTable', tableData);
    }
    console.log('selectedTables', thisBooking.selectedTables);
  }

  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour), 
      table: parseInt(thisBooking.selectedTables),
      duration: parseInt(thisBooking.dom.duration.value),
      ppl: parseInt(thisBooking.dom.people.value),
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      starters: [],
    };

    for(let starter of thisBooking.dom.starters){
      if(starter.checked == true){
        payload.starters.push(starter.value);
      }
    }
    
    console.log('payload', payload);

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
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
        thisBooking.updateDOM();
      });

    //thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
    
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function(){});

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function(){});

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    //thisBooking.dom.datePicker.addEventListener('updated', function(){});

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.allTables.addEventListener('click', function(event){
      thisBooking.initTables(event); 
    });

    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
    
  }
}

export default Booking;