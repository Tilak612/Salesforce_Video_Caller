import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const constraints = window.constraints = {
    audio: {
        echoCancellation: { exact: true }
    },
    video: true
};
export class helper {
    // function used for Start Camera
    async init(self) {
        try {
            self.localStream = await navigator.mediaDevices.getUserMedia(constraints)
            const videoTracks = self.localStream.getVideoTracks();
            const selectedVideoTrack = videoTracks[0];
            const newStream = new MediaStream();
            newStream.addTrack(selectedVideoTrack);
            self.remoteStream = new MediaStream()
            self.template.querySelector('.user1').srcObject = newStream
            self.template.querySelector('.user2').srcObject = self.remoteStream
            self.localStream.getTracks().forEach((track) => {
                self.peerConnection.addTrack(track, self.localStream);
            });
            self.peerConnection.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                    self.remoteStream.addTrack(track);
                });
            };
        } catch (e) {
            console.log(e);
        }
    }
    showNotification(self, title, message, variant) {
        console.log('check error');
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        self.dispatchEvent(evt);
    }

}