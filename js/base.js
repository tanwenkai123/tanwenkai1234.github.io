; (function (window, QrCodeRecognition) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        define(QrCodeRecognition());
    } else if (typeof exports === 'object') {
        module.exports = QrCodeRecognition();
    } else {
        window.QrCodeRecognition = QrCodeRecognition();
    };

}(typeof window !== "undefined" ? window : this, () => {
    "use strict";
    return class QrCodeRecognition {
        constructor(opts = {}) {
            this.timer = null;
            this.result = "";
            this.isAnimation = true;
            this.lineWidth = opts.borderWidth || 3;
            this.strokeStyle = opts.lineColor || 'red';
            this.audio = new Audio(opts.audio || './js/tone.mp3');
            this.video = document.createElement('video');
            this.file = document.querySelector(opts.uploadId);
            this.cvsele = document.querySelector(opts.sweepId);
            this.canvas = this.cvsele.getContext('2d');
            this.seuccess = opts.seuccess || Function;
            this.error = opts.error || Function;
        };

        draw(begin, end) {
            this.canvas.beginPath();
            this.canvas.moveTo(begin.x, begin.y);
            this.canvas.lineTo(end.x, end.y);
            this.canvas.lineWidth = this.lineWidth;
            this.canvas.strokeStyle = this.strokeStyle;
            this.canvas.stroke();
        };

        cance() {
            this.isAnimation = false;
//             cancelAnimationFrame(this.timer);
            setTimeout(() => {
                this.cvsele.style.display = "none";
            }, 1000);
            
        };

        untie() {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                const { videoWidth, videoHeight } = this.video;
                this.cvsele.width = videoWidth;
                this.cvsele.height = videoHeight;
                this.canvas.drawImage(this.video, 0, 0, videoWidth, videoHeight);
                try {
                    const img = this.canvas.getImageData(0, 0, videoWidth, videoHeight);
                    const obj = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
                    if (obj) {
                        const loc = obj.location;
                        this.draw(loc.topLeftCorner, loc.topRightCorner);
                        this.draw(loc.topRightCorner, loc.bottomRightCorner);
                        this.draw(loc.bottomRightCorner, loc.bottomLeftCorner);
                        this.draw(loc.bottomLeftCorner, loc.topLeftCorner);
                        if ('' != obj.data&&'undefined' != typeof (obj.data)) {
                            this.audio.play();
                            this.cance();
                            this.seuccess(obj);
                            // document.querySelector('#imgurl').src = this.cvsele.toDataURL("image/png");
                        }
                    } else {
                        this.error("????????????????????????????????????????????????");
                    }
                } catch (err) {
                    this.error("????????????????????????????????????????????????", err);
                };
            };
            if (this.isAnimation) {
                this.timer = requestAnimationFrame(() => {
                    this.untie();
                });
            }
        };

        sweep() {
            this.isAnimation = true;
            this.cvsele.style.display = "block";
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                }).then(stream => {
                    this.video.srcObject = stream;
                    this.video.setAttribute('playsinline', true);
                    this.video.setAttribute('webkit-playsinline', true);
                    this.video.addEventListener('loadedmetadata', () => {
                        this.video.play();
                        this.untie();
                    });
                }).catch(error => {
                    this.cance();
                    alert('????????????????????????????????????!');
                    // console.error(error.name + "???" + error.message + "???" + error.constraint);
                });
            } else if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    video: { facingMode: "environment" }
                }, (stream) => {
                    this.video.srcObject = stream;
                    this.video.setAttribute('playsinline', true);
                    this.video.setAttribute('webkit-playsinline', true);
                    this.video.addEventListener('loadedmetadata', () => {
                        this.video.play();
                        this.untie();
                    });
                }, (error) => {
                    this.cance();
                    alert('????????????????????????????????????!');
                    // console.error(error.name + "???" + error.message + "???" + error.constraint);
                });
            } else {
                if (navigator.userAgent.toLowerCase().match(/chrome/) && location.origin.indexOf('https://') < 0) {
                    console.error('????????????????????????????????????????????????????????????localhost ??? 127.0.0.1 ??? https ????????????????????????');
                } else {
                    this.cance();
                    alert('????????????????????????????????????!');
                }
            };
        };

        upload() {
            // this.cance();
            const file = this.file.files[0];
            const createObjectURL = window.createObjectURL || window.URL.createObjectURL || window.webkitURL.createObjectUR;

            const fReader = new FileReader();
            fReader.readAsDataURL(file); // Base64 8Bit?????????
            // fReader.readAsBinaryString(file);  // Binary ???????????????
            // fReader.readAsArrayBuffer(file);   // ArrayBuffer ?????????
            fReader.onload = (e) => {
                document.querySelector('#imgurl').src = e.target.result || createObjectURL(file);
                e.target.result && Jimp.read(e.target.result).then(async (res) => {
                    const { data, width, height } = res.bitmap;
                    try {
                        const resolve = await jsQR(data, width, height);
                        this.audio.play();
                        this.seuccess(resolve);
                    } catch (err) {
                        this.error("????????????????????????????????????????????????", err);
                    } finally {
                        console.info("?????????????????????", res);
                    }
                }).catch((err) => {
                    this.error("?????????????????????", err);
                });
            };
        };
    };
}));
