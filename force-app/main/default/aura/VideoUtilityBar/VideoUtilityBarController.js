({
    onInit : function(component, event, helper) {
        
        const empApi = component.find('empApi');
        empApi.onError($A.getCallback(error => {
            // Error can be any type of error (subscribe, unsubscribe...)
            console.error('EMP API error: ', JSON.stringify(error));
        }));
            // Get the channel from the input box
            const channel = '/event/ConnectionMessage2__e';
            // Replay option to get new events
            const replayId = -1;
            
            // Subscribe to an event
            empApi.subscribe(channel, replayId, $A.getCallback(eventReceived => {
            var userId = $A.get("$SObjectType.CurrentUser.Id");
            
            if(eventReceived.data.payload.MsgType__c=='offer' && eventReceived.data.payload.receivedId__c==userId){
            var utilityAPI = component.find("utilitybar");
            utilityAPI.getAllUtilityInfo().then(function (response) {
            if (typeof response !== 'undefined') {
            utilityAPI.openUtility();
        }
        });        }
        }))
            .then(subscription => {
            console.log('Subscription request sent to: ', subscription.channel);
            component.set('v.subscription', subscription);
        });
            
        }
        })