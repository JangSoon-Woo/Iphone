'use strict';

'use strict';

(function () {

    var elemCanvas, elemVideo, 
        elemPhone, // 폰 이미지
        context,
        windowWidth = 0, // 브라우저 폭
        windowHeight = 0, // 브라우저 높이
        canvasWidth = 0, // 캔버스 폭(브라우저 폭에 맞춤)
        canvasHeight = 0, // 캔버스 높이(브라우저 높이에 맞춤)
        scrollY = 0, // 현재 스크롤 위치
        relativeScrollY = 0, // 각 키프레임에서 사용하는 상대적인 스크롤 위치
        prevDurations = 0, // 이전 키프레임까지의 duration
        totalScrollHeight = 0, // 스크롤을 할 수 있는 전체 높이(body의 높이로 세팅)
        currentKeyframe = 0, // 현재 키프레임(0, 1)
        phoneWidth = 1500, // 아이폰 이미지 기본 크기
        phoneHeight = 2850, // 아이폰 이미지 기본 크기

        resizeHandler, scrollHandler, render, drawCanvas, calcAnimationValue, calcFinalValue, init, 
        pixelDuration = 0, // 키프레임 당 차지하는 스크롤 높이

        // 키프레임을 미리 지정
        // 첫번째 시작값 마지막이 끝나는 값
        keyframes = [
            {
                animationValues: {
                    videoScale: [1, 2], // 첫번째 스크롤: 비디오가 원래 크기였다가 2배로 커짐
                    triangleMove: [0, 200],
                    rectangleMove: [0, 500]
                }
            },
            {
                animationValues: {
                    videoScale: [2, 0.5], // 두번째 스크롤: 비디오가 2배에서 0.5배로 작아짐
                    triangleMove: [200, 1000], // x가 급격하게 커지는 부분
                    rectangleMove: [500, 500] // 늘어난 상태에서 가만히 정지
                }
            }
        ],

        elemBody = document.body,
        elemCanvas = document.getElementById('cover-canvas'),
        context = elemCanvas.getContext('2d'); //context개체를 가져옴
        elemVideo = document.getElementById('video-studiomeal');

    init = function () {
        // 브라우저의 창 크기를 가져옴
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        resizeHandler(); // 처음에 실행되야할 내용이기 때문에 init()함수에서 호출
        render(); // 그림을 실제로 그려주는 함수

        // requestAnimationFrame: 준비된 애니메이션을 최적화되게 실행시켜줌
        window.addEventListener('resize', function () {
            requestAnimationFrame(resizeHandler);
        });
        window.addEventListener('scroll', function () {
            requestAnimationFrame(scrollHandler);
        });

        elemPhone = document.createElement('img');
        elemPhone.src = 'phone.png';
        elemPhone.addEventListener('load', function () {
            drawCanvas();
        });
    };

    //브라우저 창 사이즈가 변화될 때 실행되는 함수
    resizeHandler = function () {
        var i;
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        // 애니메이션이 실행되는 시간(키프레임이 2개 니까)
        totalScrollHeight = 0; // 스크롤 할 수 있는 전체 높이(타임라인: 스크롤 영역)
        pixelDuration = 0.5 * windowHeight; // 윈도우 높이의 절반(keyframe: 2개)

        // 키프레임만큼 pixelDuration 값을 더해주면 전체 스크롤을 할 수 있는 높이가 된다.
        // 우리는 키프레임이 2개라는 것을 미리 알고있고 높이 자체가 윈도우 높이라는걸 알지만
        // totalScrollHeight를 창의 높이로 세팅해도 되지만 이 방법이 좋다
        // 키프레임이 갯수가 늘어도 자동으로 늘어나기 때문에
        for (i = 0; i < keyframes.length; i++) {
            totalScrollHeight += pixelDuration; // 총 스크롤 범위
        }
        totalScrollHeight += windowHeight;

        //스크롤 되는 전체 높이를 바디의 전체 높이 값으로 세팅
        elemBody.style.height = totalScrollHeight + 'px';
        // 고해상도 이미지 처리방법
        // 윈도우 폭의 2배로 해줌
        elemCanvas.width = canvasWidth = windowWidth * 2;
        elemCanvas.height = canvasHeight = windowHeight * 2;
        // style시트로 다시 줄여줌(2배로 해준다음에 css로 줄여줌)
        elemCanvas.style.width = windowWidth + 'px';
        elemCanvas.style.height = windowHeight + 'px';
    };

    scrollHandler = function () {
        scrollY = window.pageYOffset; //현재 스크롤된 위치

        // scroll이 0보다 작다면? 그럼 마이너스란 소리인데 사전에 오류동작을 차단
        // 스크롤 범위를 벗어나면 종료되게 만들어줌(스크롤범위를 안전하게 제한)
        // totalScrollHeight: 전체 스크롤 된 범위
        if (scrollY < 0 || scrollY > (totalScrollHeight - windowHeight)) {
            return;
        }

        // scrollY: 현재 스크롤 범위
        // pixelDuration: 스크롤 범위(각 keyFrame마다 가지고 있는 지속시간) => window높이의 절반
        // prevDuration: 이전 스크롤된 값
        if (scrollY > pixelDuration + prevDurations) {
            //pixelDuration + prevDurations 이 수치가 넘어갈 때 마다 pixelDuration을 더해줌(계속 쌓이는 값)
            prevDurations += pixelDuration;
            currentKeyframe++; //현재 몇 프레임인지를 판단하는 값
        } else if (scrollY < prevDurations) {
            currentKeyframe--;
            prevDurations -= pixelDuration;
        }

        // relativeScrollY: keyFrame 입장에서 상대적으로 얼마나 스크롤 되었는지 => calcAnimationValue에서 썼었음
        // scrollY: 전체 스크롤 된 값
        // preDurations: 이전 키프레임들에서 스크롤 된 값
        relativeScrollY = scrollY - prevDurations;
        render();
    };

    render = function () {
        // viedeoScale: 비디오의 크기
        // triangleMove: x의 모양
        // rectangleMove: 위의 x위에 박스
        var videoScale, triangleMove, rectangleMove;

        if (keyframes[currentKeyframe]) { 
            //비디오의 크기
            videoScale = calcAnimationValue(keyframes[currentKeyframe].animationValues.videoScale);
            // X 모양
            triangleMove = calcAnimationValue(keyframes[currentKeyframe].animationValues.triangleMove);
            rectangleMove = calcAnimationValue(keyframes[currentKeyframe].animationValues.rectangleMove);
        } else {
            return;
        }

        // 캔버스에 그려주는게 아니라 CSS에서 scale로 조정
        // css에서 100%크기로 미리 지정해 놓음
        // calcAnimationValue를 통해 계산된 video값을 넣어줌

        elemVideo.style.transform = 'scale(' + videoScale + ')';
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        
        if (elemPhone) {
            drawCanvas(videoScale, triangleMove, rectangleMove);
        }
    };

    calcAnimationValue = function (values) {

        return (relativeScrollY / pixelDuration) * (values[1] - values[0]) + values[0];
    };

    // 스크롤값을 보면서 계속 갱신하면서 계산
    drawCanvas = function (videoScale, triangleMove, rectangleMove) {
        // 매개변수에 인자로 들어온 값이 있으면 참일 테니까 그 값이 대입이 될 것.
        var videoScale = videoScale || 1,
            triangleMove = triangleMove || 0,
            rectangleMove = rectangleMove || 0;

        context.save();
        context.translate((canvasWidth - phoneWidth * videoScale) * 0.5,
            (canvasHeight - phoneHeight * videoScale) * 0.5);

        context.drawImage(elemPhone, 0, 0, phoneWidth * videoScale, phoneHeight * videoScale);

        // 이전에 그렸던 스타일을 저장, 기억한 후 다시 컨텍스트에 불러와 그릴 경우 save(), restore() 함수를 사용
        // 다시 이 전에 사용된 스타일을 불러오기 위해서는 현재 캔버스의 컨텍스트에서 restore()를 입력됨.
        // save()를 누르면 기존에 저장되었던 스타일이 사라지지 않고 새로 저장된 스타일의 이전으로 기억됨
        context.restore();

        context.fillStyle = 'black';

        // Canvas에서 도형을 그리는 작업
        context.beginPath();
        context.moveTo(canvasWidth * 0.5 - 1500, -triangleMove - 1700);
        context.lineTo(canvasWidth * 0.5, canvasHeight * 0.5 - 150 - triangleMove);
        context.lineTo(canvasWidth * 0.5 + 1500, -triangleMove - 1700);
        //시작점과 동일한 지점으로 가서 마무리
        context.lineTo(canvasWidth * 0.5 - 1500, -triangleMove - 1700);
        context.fill();
        context.closePath();

        context.beginPath();
        context.moveTo(canvasWidth * 0.5 - 1500, canvasHeight + triangleMove + 1700);
        context.lineTo(canvasWidth * 0.5, canvasHeight * 0.5 + 150 + triangleMove);
        context.lineTo(canvasWidth * 0.5 + 1500, canvasHeight + triangleMove + 1700);
        context.lineTo(canvasWidth * 0.5 - 1500, canvasHeight + triangleMove + 1700);
        context.fill();
        context.closePath();

        context.beginPath();
        context.moveTo(canvasWidth * 0.5 - 1700 - triangleMove, -1700);
        context.lineTo(canvasWidth * 0.5 - 130 - triangleMove, canvasHeight * 0.5);
        context.lineTo(canvasWidth * 0.5 - 1700 - triangleMove, canvasHeight + 1700);
        context.lineTo(canvasWidth * 0.5 - 1700 - triangleMove, -1700);
        context.fill();
        context.closePath();

        context.beginPath();
        context.moveTo(canvasWidth * 0.5 + 1700 + triangleMove, -1700);
        context.lineTo(canvasWidth * 0.5 + 130 + triangleMove, canvasHeight * 0.5);
        context.lineTo(canvasWidth * 0.5 + 1700 + triangleMove, canvasHeight + 1700);
        context.lineTo(canvasWidth * 0.5 + 1700 + triangleMove, -1700);
        context.fill();
        context.closePath();

        context.fillRect(0, canvasHeight * 0.5 - 2600 - rectangleMove, canvasWidth, 2000);
        context.fillRect(0, canvasHeight * 0.5 + 600 + rectangleMove, canvasWidth, 2000);
    };
    init();

})();