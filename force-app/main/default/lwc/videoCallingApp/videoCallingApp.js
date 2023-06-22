import { LightningElement, wire, track, api } from 'lwc';
import GETUSERDATA from '@salesforce/apex/VideoCallingController.getUserData';
import currentUserId from '@salesforce/user/Id';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled, } from 'lightning/empApi';
import { salesforceHelper } from './helper';
import IMAGES from "@salesforce/resourceUrl/videocalling";

export default class VideoCallingApp extends LightningElement {
    loaded = false
    userData = [];
    userDatafinal = [];
    util
    cancelFlag = false
    phoneImage = IMAGES + '/phone.png';
    channelName = '/event/ConnectionMessage2__e';
    subscription;
    answercallInfo
    callStarted = true
    recjectIconFlag = true
    @track activeUser
    activeUserFlag = true;
    searchUserFlag = true
    toastflag = false
    connectedCallback() {
        this.handleSubscribe()
        this.util = new salesforceHelper();
        GETUSERDATA({ userId: currentUserId }).then((data) => {
            let temp = data.map(item => {
                const { FirstName, LastName } = item;
                let initials = '';
                if (FirstName && LastName) {
                    initials = (FirstName.charAt(0) + LastName.charAt(0)).toUpperCase();
                } else if (LastName) {
                    initials = LastName.substring(0, 2).toUpperCase();
                }

                return { ...item, Initial: initials };
            });
            this.userDatafinal = [...temp]
            this.userData = [...temp]
        }).catch((e) => {
            this.util.showNotification(this, "Error", e?.body?.message, 'error')
        })
    }

    handleSubscribe() {
        let self = this
        const messageCallback = async function (response) {
            console.log('now ');
            let data = response?.data?.payload
            console.log(data);
            if (data) {
                self.callAction(data);
            }
        };

        subscribe(this.channelName, -1, messageCallback).then((response) => {
            console.log(
                'Subscription request sent to: ',
                JSON.stringify(response.channel)
            );
            this.subscription = true;

        }).catch((e) => {
            this.showNotification("Error", e.message, 'error')

            console.log('error');
        })
    }
    disconnectedCallback() {
        unsubscribe(this.subscription, response => {
            his.template.querySelector("c-callercmp").endCalltoggle()
        });
    }
    getUserDetail(event) {
        let flag = this.template.querySelector("c-callercmp")?.videoCallFlag == undefined ? true : this.template.querySelector("c-callercmp")?.videoCallFlag
        if (flag) {

            let userId = event.currentTarget.dataset.key;
            this.activeUser = this.userData.find(function (item) {
                return item.Id === userId;
            });
            this.activeUserFlag = false
            this.goToBack(this);
        } else {
            this.util.showNotification(this, "Error", 'please end call', 'error')

        }
    }
    @api goToBack() {
        let flag = this.template.querySelector("c-callercmp")?.videoCallFlag == undefined ? true : this.template.querySelector("c-callercmp")?.videoCallFlag
        if (flag) {
            let sider = this.template.querySelector('.sidebar');
            sider.classList.toggle("active");
        } else {
            this.util.showNotification(this, "Error", 'please end call', 'error')

        }
    }
    searchUser(event) {
        let val = event.target.value
        this.userData = [...this.util.searchRecords(this.userDatafinal, val)]
        if (val != '' && this.userData.length == 0) {
            this.searchUserFlag = false
        } else {
            this.searchUserFlag = true

        }

    }
    async callCammera() {
        let flag = this.template.querySelector("c-callercmp")?.videoCallFlag == undefined ? true : this.template.querySelector("c-callercmp")?.videoCallFlag
        if (flag) {
            await this.template.querySelector("c-callercmp").startCam();
            this.loaded = true
            this.recjectIconFlag = false
            this.toastflag = true;
            setTimeout(async()=>{
                //await alert(this.callStarted)
                if(this.callStarted){
                    this.template.querySelector("c-callercmp").endCalltoggle2()
                }
            },10000)
        } else {
            this.util.showNotification(this, "Error", 'please end call', 'error')
        }

    }
    async callAccept() {
        try {
            this.toastflag = false;
            this.template.querySelector("c-callercmp").isCammeraFlag = true
            await this.template.querySelector("c-callercmp").createanswer(JSON.parse(this.answercallInfo.Message__c), this.answercallInfo.senderId__c);
        } catch (e) {
            alert('error')
            console.log(e);
        }

    }
    callReject(event) {
        let tempval = event?.currentTarget?.dataset?.id == undefined ? true : false
        if (tempval) {
            this.toastflag = false;
            this.recjectIconFlag = true;
            this.loaded = false;
            this.template.querySelector("c-callercmp").rejectcall();
        } else {
            this.template.querySelector("c-callercmp").endCalltoggle2()
        }
    }
    callClose() {
        this.loaded = false
        this.template.querySelector("c-callercmp").endcallaction()
        this.cancelFlag = false;
    }
    connectCallHandler(){
        this.loaded = false
    }
    async callAction(data) {
        if (data.receivedId__c == currentUserId && data.MsgType__c == 'offer') {
            //loding and receive toast flag
            this.loaded = true;
            this.toastflag = true;
            //for silder bar open 
            let tempRecord = { currentTarget: { dataset: { key: data.senderId__c } } }
            await this.getUserDetail(tempRecord);
            let sider = this.template.querySelector('.sidebar');
            if (sider.classList.value.includes('active') == false) {
                sider.classList.toggle("active");
            }
            this.answercallInfo = data
        } else if (data.senderId__c == currentUserId && data.MsgType__c == 'answer') {
           //alert('add answer')
          
            this.callStarted = false
            this.recjectIconFlag = true
            this.toastflag = false;
            await this.template.querySelector("c-callercmp").addAnswer(JSON.parse(data.Message__c))
            await this.template.querySelector("c-callercmp").videotoggle();
        } else if (data.senderId__c == currentUserId && data.MsgType__c == 'reject') {
            this.recjectIconFlag = true
            this.toastflag = false;
            await this.template.querySelector("c-callercmp").togglecall();
            this.toastflag = false;
            this.cancelFlag = true;
            this.callStarted = true
        } else if ((data.senderId__c == currentUserId || data.receivedId__c == currentUserId || data.senderId__c == this.activeUser.Id || data.receivedId__c == this.activeUser.Id) && data.MsgType__c == 'endCall') {
            try {
                this.toastflag = false;
                this.recjectIconFlag = true;
                this.loaded = false;
                this.callStarted = true
                this.template.querySelector("c-callercmp").endcallaction()
            } catch (e) {
                alert('error1')
                console.log(e);
            }
        } else if (data.receivedId__c == currentUserId && data.senderId__c==this.activeUser.Id && data.MsgType__c == 'candidates') {
          //alert('canditiat');
                       if(data.Message__c!=null){
            let candList = JSON.parse(data.Message__c);
            
            this.template.querySelector("c-callercmp").receiveIceCandidate(candList)
            }
        }
        if (data.receivedId__c == currentUserId && data.MsgType__c == 'answer') {
            await this.template.querySelector("c-callercmp").videotoggle();
        } else if (data.receivedId__c == currentUserId && data.MsgType__c == 'reject') {
                this.loaded = false;
                this.template.querySelector("c-callercmp").endcallaction()
            }


    }
}