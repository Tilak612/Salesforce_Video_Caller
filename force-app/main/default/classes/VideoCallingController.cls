public with sharing class VideoCallingController {
    @AuraEnabled(cacheable=true)
    public static List<User> getUserData(String userId){
        List<User> userList=new List<User>();
        try {
             userList=[SELECT Id, FirstName, LastName FROM User where Id !=:userId];
            return userList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static void sendmessage(String message,string sendby,String type,String receiveId){
        ConnectionMessage2__e event = new ConnectionMessage2__e(Message__c = message,senderId__c=sendby,MsgType__c=type,receivedId__c=receiveId);
         Database.SaveResult result = EventBus.publish(event);
       System.debug(result);
     }
}