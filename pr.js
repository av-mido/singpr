var casper = require('casper').create({
    verbose: true,
    logLevel: "debug"
});
var fs = require('fs');

var credentials = JSON.parse(fs.read('credentials.json'));

function selectForm()
{
    console.log("This is an example log message in selectForm.");
    var targetDocument = document.querySelector('frame[name="bottomFrame"]').contentDocument.querySelector('frame[name="mainFrame"]').contentDocument;
    var e = targetDocument.querySelector('.txtFill_singleLine');

    e.selectedIndex = 8; // was 7
    e.onchange();
}

function fillForm(credentials)
{
    console.log("this is a log message inside fillForm.");
    
    var targetDocument = document.querySelector('frame[name="bottomFrame"]').contentDocument.querySelector('frame[name="mainFrame"]').contentDocument;

    // console.log("targetDocument.body.innerHTML: " + targetDocument.body.innerHTML);

    var e = targetDocument.querySelector('input[id="apptDetails.identifier1"]');

    console.log("is e null? " + e);

    e.value = credentials.fin;
    var e = targetDocument.querySelector('input[name="apptDetails.identifier2"]');
    e.value = credentials.peopleCount;
    var e = targetDocument.querySelector('input[name="apptDetails.identifier3"]');
    e.value = credentials.contact;   
    var e = targetDocument.querySelector('input[name="Submit"]');

    console.log("About to click at end of fillForm");
    e.click();       
}

function countAvailableDates()
{
    var obj = {};
    var e = document.querySelector('#main > form > table:nth-child(83) > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > table > tbody > tr > td.txtBlk > strong');
 // var e = document.querySelector('#main > form > table:nth-child(81) > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > table > tbody > tr > td.txtBlk > strong');    
    var txt = e.textContent;

    console.log("countAvailableDates txt: ", txt);

    obj.month = txt.replace(/(?:\r\n|\r|\n|\t)/g,'').trim();    
    var e = document.querySelectorAll('td.cal_AS');    
    obj.available = e.length;
    var arr = [];
    if(e.length > 0)
    {
        for(i=0;i<e.length;++i)
            arr.push(e[i].querySelector('div > table > tbody > tr > td').textContent.trim());
    }
    obj.availableDates = arr;
    
    var e = document.querySelectorAll('td.cal_AF');    
    obj.booked = e.length; 
    var e = document.querySelectorAll('td.cal_PH');    
    obj.holidays = e.length; 

    console.log(JSON.stringify(obj,null,2));
    
    return obj;
}

casper.on('remote.message', function (message) {
  this.echo('Message: ' + message);
});

//Code to display errors from the page
 casper.on('page.error', function (msg, trace) {
     console.log('Error: ' + msg, 'ERROR');
 });

casper.start('https://eappointment.ica.gov.sg/ibook/index.do',function(){
    //this.capture('pr.png');
    console.log("Starting...");
    this.evaluate(selectForm);
});

casper.then(function(){
    console.log("Calling fillForm...");
   this.evaluate(fillForm,credentials);
});

var jsonArr = [];

for(i = 0; i<12; ++i)
{
    //Count the number of 
    casper.withFrame('bottomFrame', function() {
        this.withFrame('mainFrame',function(){
           obj = this.evaluate(countAvailableDates);
           jsonArr.push(obj);
        });
    });    

    casper.withFrame('bottomFrame', function() {
        this.withFrame('mainFrame',function(){
               console.log("i: ", i);
            	casper.click('a[href="javascript:doNextMth(document.forms[0]);"]');
        });
    });
    
    //casper.then(function(){
    //   this.capture('pr.png');  
    //});
}

casper.then(function(){
    console.log("Finished. Months: ");
    console.log(JSON.stringify(jsonArr, null, 2));
});
casper.run();
