// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const DialogflowApp = require('actions-on-google').DialogflowApp;
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const express = require("express");
const bodyParser = require("body-parser");

const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

restService.use(bodyParser.json());

restService.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening at port 8000:");
});

 
restService.post("/dialogflowCalculatorFulfillment", function(request, response){
  console.log("request", request);
  processV1Request(request, response);
  //response.json({"Kalyani":"ABC"});
});

function processV1Request(request, response){
  
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({ request: request, response: response });

  const param = app.getContextArgument('actions_intent_option',
  'OPTION');
  // Create handlers for Dialogflow actions as well as a 'default' handler

  function defaultAction(){
    // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
    if (requestSource === googleAssistantRequest) {
        let responseToUser = {
            //googleRichResponse: googleRichResponse, // Optional, uncomment to enable
            //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
            speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
            text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendGoogleResponse(responseToUser);
    } else {
        let responseToUser = {
            //data: richResponsesV1, // Optional, uncomment to enable
            //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
            speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
            text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(responseToUser);
    }
}

function welcomeAction(){
    let userId = app.getUser().userId;
    //let result = retirmentService.getUserRetirmentIncome(userId,(result) =>{ console.log("retrieved user",result)});

     //  let welcomeMessage = "Hey, I am an Advisory bot, I can help you to determine how much house you can afford. For this, I need details about your income, down payment, and monthly debts. you can estimate the mortgage amount that works with your budget. Would you like to try it out? Please say Yes or No.";
     let welcomeMessage ="Hey, I am an Calculator bot, How can I help you.";
     let responseToUser = {
       speech: welcomeMessage, // spoken response
       text: welcomeMessage // displayed response
     };
       
       // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
       if (requestSource === googleAssistantRequest) {
         sendGoogleResponse(welcomeMessage);

       } else {      
           sendResponse(responseToUser); // Send simple response to user
       }
   
}

function unknownAction() {
  // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
  if (requestSource === googleAssistantRequest) {
      sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
  } else {
      sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
  }
}

function addNumbersAction() {
  let number1 = app.getArgument("number1");
  let number2 = app.getArgument("number2");

  let sum = number1 + number2;

  var responseToUser = "The addition of two no. is -"+ sum;
  if (requestSource === googleAssistantRequest) {
    sendGoogleResponse(responseToUser); // Send simple response to user
  } else {
      sendResponse(responseToUser); // Send simple response to user
  }
}

  const actionHandlers = {
      // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
      'input.welcome': welcomeAction,
      // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
      'input.unknown': unknownAction,
      //The add two number intent has been matched
      'addNumbers': addNumbersAction,
      // Default handler for unknown or undefined actions
      'default': defaultAction
  };

  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {

      if(param!==null && param!==undefined){
      //here option value would be action name.
       action = param.value;
      } else {
      action = 'default';
     }
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse(responseToUser) {
      console.log("sending google response");
      if (typeof responseToUser === 'string') {
          app.ask(responseToUser); // Google Assistant response
      } else {
          // If speech or displayText is defined use it to respond
          let googleResponse = app.buildRichResponse().addSimpleResponse({
              speech: responseToUser.speech || responseToUser.displayText,
              displayText: responseToUser.displayText || responseToUser.speech
          });
          // Optional: Overwrite previous response with rich response
          if (responseToUser.googleRichResponse) {
              googleResponse = responseToUser.googleRichResponse;
          }
          // Optional: add contexts (https://dialogflow.com/docs/contexts)
          if (responseToUser.googleOutputContexts) {
              app.setContext(...responseToUser.googleOutputContexts);
          }
          console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
          app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
      }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse(responseToUser) {
      console.log("sending simple response");
      // if the response is a string send it as a response to the user
      if (typeof responseToUser === 'string') {
          let responseJson = {};
          responseJson.speech = responseToUser; // spoken response
          responseJson.displayText = responseToUser; // displayed response
          response.json(responseJson); // Send response to Dialogflow
      } else {
          // If the response to the user includes rich responses or contexts send them to Dialogflow
          let responseJson = {};
          // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
          responseJson.speech = responseToUser.speech || responseToUser.displayText;
          responseJson.displayText = responseToUser.displayText || responseToUser.speech;
          // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
          responseJson.data = responseToUser.data;
          // Optional: add contexts (https://dialogflow.com/docs/contexts)
          responseJson.contextOut = responseToUser.outputContexts;
          console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
          response.json(responseJson); // Send response to Dialogflow
      }
  }
}