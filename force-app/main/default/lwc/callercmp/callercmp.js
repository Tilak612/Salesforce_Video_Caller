import { LightningElement, api, track } from 'lwc';
import currentUserId from '@salesforce/user/Id';
import sendMessage from '@salesforce/apex/VideoCallingController.sendmessage';
import { helper } from './helper';
import IMAGES from "@salesforce/resourceUrl/videocalling";

export default class Callercmp extends LightningElement {
    @api peerConnection
    localStream;
    remoteStream;
    addiceanswer = false
    sendICECandidateDirectly
    videostartflag = false
    videoImage = IMAGES + '/camera.png'
    audioImage = IMAGES + '/mic.png'
    phoneImage = IMAGES + '/phone.png';
    @api videoCallFlag = false;
    videoCallFlag = true;
    @api isCammeraFlag = false;
    @api activeuser
    util = new helper();
    iceCandidates = []
    connectedCallback() {
        try {
            this.initConnection();
        } catch (e) {
           /// alert('error')
            console.log(e.message);
            this.util.showNotification(this, "Error", 'Something Wrong with Application', 'error')
        }
    }
    initConnection() {
        var configuration = {
            'configuration': {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            },
            'iceServers': [
                { 'urls': 'stun:stun.l.google.com:19302' }
            ]
        };
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.addEventListener("connectionstatechange", async (event) => {
            console.log('$$$$ ' + this.peerConnection.connectionState);
            if (this.peerConnection.connectionState == 'failed') {
                this.util.showNotification(this, "Error", 'Something Wrong with Application', 'error')
            } else if (this.peerConnection.connectionState == 'disconnected') {
                this.endcallaction()
            } else if (this.peerConnection.connectionState == 'connected') {
                this.callConnect()
            }
        })
        this.peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                this.iceCandidates.push(event.candidate);
            }
        })
    }
    @api async startCam() {
        if (this.videoCallFlag) {
            try {
                this.isCammeraFlag = true
                await this.util.init(this);
                await this.createOffer();
            } catch (e) {
                console.log(e.message);
                this.util.showNotification(this, "Error", 'Something Wrong with Application', 'error')
            }
        } else {
            this.util.showNotification(this, "Error", 'Already your on Call', 'error')
        }
    }
    //inital Create offer for connection
    @api async createOffer() {
        try {
            this.videoCallFlag = false
            let offer = await this.peerConnection.createOffer()
            await this.peerConnection.setLocalDescription(offer);
            this.sendDataToPlatformEvent(JSON.stringify(this.peerConnection.localDescription), this.activeuser.Id, currentUserId, 'offer')
        } catch (reason) {
            this.util.showNotification(this, "Intail offer", reason?.message, 'error')
            console.log('Intial error offer : ' + reason);
        };
    }
    @api videotoggle() {
        this.template.querySelector('.inputbox').checked = true
    }
    //Receive offer and  Create answer for connection
    @api async createanswer(offer, sendby) {
        try{
        this.videoCallFlag = false
        await this.util.init(this)
        await this.peerConnection.setRemoteDescription(offer)
        let answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer);
        setTimeout(async()=>{
             this.sendDataToPlatformEvent(JSON.stringify(this.peerConnection.localDescription), currentUserId, sendby, 'answer')
            this.addiceanswer = true;
        },100)
        }catch(e){
            this.util.showNotification(this, "Answer Error", e.message, 'error')
            console.log(e);
        }
    }
    //after Receive answer and send ice Candidates 
    @api async addAnswer(answer) {
        try {
            this.peerConnection.setRemoteDescription(answer);
            if (this.iceCandidates.length > 0) {
                let iceCandidate = this.iceCandidates.filter(element => element !== null)
                this.sendDataToPlatformEvent(JSON.stringify(iceCandidate), this.activeuser.Id, currentUserId, 'candidates');
            }
        } catch (e) {
          //  alert('errr')
          this.util.showNotification(this, "add Answer", e?.message, 'error')
            console.log(e);
        }
    }

    @api async rejectcall() {
        this.sendDataToPlatformEvent('ss', currentUserId, this.activeuser.Id, 'reject')
    }
    //This use to send Message through Platform event
    @api sendDataToPlatformEvent(message, receiveId, SenderId, type) {
        sendMessage({ message: message, sendby: SenderId, type: type, receiveId: receiveId }).then(() => {
            console.log('success');
        }).catch((e) => {
            this.util.showNotification(this, "send Platform", e?.message, 'error')
            console.log(e);
            
        })
    }
    @api async receiveIceCandidate(candidateList) {
        candidateList.forEach((ele) => {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(ele, function () { }, function (e) { console.log("Problem adding ice candidate: " + e); }))

        })
        if (this.addiceanswer) {
            let iceCandidate = this.iceCandidates.filter(element => element !== null)
            this.sendDataToPlatformEvent(JSON.stringify(iceCandidate), this.activeuser.Id, currentUserId, 'candidates');
        }
    }
    cameratoggle() {
        let videoTrack = this.localStream.getTracks().find(track => track.kind === 'video')
        if (videoTrack.enabled) {
            videoTrack.enabled = false
            this.template.querySelector('.camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            videoTrack.enabled = true
            this.template.querySelector('.camera-btn').style.backgroundColor = '#085F63'
        }
    }
    audiotoggle() {
        let audioTrack = this.localStream.getTracks().find(track => track.kind === 'audio')
        if (audioTrack.enabled) {
            audioTrack.enabled = false
            this.template.querySelector('.mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            audioTrack.enabled = true
            this.template.querySelector('.mic-btn').style.backgroundColor = '#085F63'
        }
    }
    @api togglecall() {
        this.videoCallFlag = !this.videoCallFlag
    }
    @api endCalltoggle() {
        this.sendDataToPlatformEvent('ss', currentUserId, this.activeuser.Id, 'endCall')
    }
    @api endCalltoggle2() {
        this.sendDataToPlatformEvent('ss', currentUserId, this.activeuser.Id, 'endCall')
    }
    @api endcallaction() {
        this.addiceanswer = false;
        this.iceCandidates = []
        this.peerConnection.close();
        this.template.querySelector('.inputbox').checked = false
        this.isCammeraFlag = false
        this.videoCallFlag = true
        this.sendICECandidateDirectly = false
        this.initConnection();
        try {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
        } catch (e) {
            // alert('error')
            console.log(e);
        }
    }
    callConnect(){
        const selectEvent = new CustomEvent('connectcall', {
            detail: false
        });
        this.dispatchEvent(selectEvent);
    }

}