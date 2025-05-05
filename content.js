// 0.5초마다 스티커 버튼을 감지하고 파일 업로드 버튼 추가
setInterval(() => {
    const stickerButtons = document.querySelectorAll('a.css-1394o6u.e1h77j9v5');
    
    stickerButtons.forEach(button => {
      // 이미 처리된 버튼은 건너뜁니다
      if (button.dataset.processed) return;
      
      // 버튼을 처리된 것으로 표시
      button.dataset.processed = "true";
      
      // 파일 업로드 라벨 생성
      const fileLabel = document.createElement('label');
      fileLabel.className = 'css-1feryfk e1h77j9v6';
      fileLabel.innerHTML = '<span class="blind">파일 올리기</span>';
      
      // 요청한 CSS 스타일 적용
      fileLabel.style.display = 'inline-block';
      fileLabel.style.width = '21px';
      fileLabel.style.height = '18px';
      fileLabel.style.marginTop = '1px';
      fileLabel.style.marginRight = '14px';
      fileLabel.style.marginLeft = '14px';
      fileLabel.style.verticalAlign = 'top';
      fileLabel.style.cursor = 'pointer';
      fileLabel.style.overflow = 'hidden';
      fileLabel.style.background = 'url(/img/IcoCmtPicture.svg) 0% 0% / 21px no-repeat';
      
      // 파일 입력 요소 생성
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.className = 'blind';
      fileInput.accept = '.png, .jpg, .jpeg, .gif, .webp, .mp4, .webm, .ogg, .avi';
      
      // 파일 입력 이벤트 처리
      fileInput.addEventListener('change', function(event) {
        if (this.files && this.files[0]) {
          uploadFile(this.files[0], button);
        }
      });
      
      // 파일 입력을 라벨에 추가
      fileLabel.appendChild(fileInput);
      
      // 라벨을 스티커 버튼 뒤에 삽입
      button.parentNode.insertBefore(fileLabel, button.nextSibling);
      
      // 연관된 textarea 찾기
      const textarea = findSpecificTextarea(button);
      if (textarea && !textarea.dataset.pasteListenerAdded) {
        // paste 이벤트 리스너 추가
        textarea.addEventListener('paste', handlePaste);
        textarea.dataset.pasteListenerAdded = "true";
      }
    });
  }, 500);
  
  // 붙여넣기 이벤트 처리 함수
  function handlePaste(event) {
    const textarea = event.target;
    const clipboardData = event.clipboardData || window.clipboardData;
    
    // 클립보드에 이미지가 있는지 확인
    if (clipboardData && clipboardData.items) {
      let imageFound = false;
      
      // 클립보드 항목을 순회
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        
        // 이미지 항목인지 확인
        if (item.type.indexOf('image') !== -1) {
          imageFound = true;
          
          // 이미지 파일 가져오기
          const blob = item.getAsFile();
          
          // 로딩 표시기 생성
          const loadingIndicator = createLoadingIndicator();
          textarea.parentNode.insertBefore(loadingIndicator, textarea.nextSibling);
          
          // 이미지 파일 업로드
          uploadPastedFile(blob, textarea, loadingIndicator);
          
          // 이미지 붙여넣기 기본 동작 방지
          event.preventDefault();
          break;
        }
      }
      
      // 이미지가 아닌 경우 기본 붙여넣기 동작 유지
      if (!imageFound) {
        return;
      }
    }
  }
  
  // 붙여넣은 파일 업로드
  function uploadPastedFile(file, textarea, loadingIndicator) {
    if (!file) {
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      return;
    }
    
    // 파일 크기 및 유형 검사
    if (file.size > 400 * 1024 * 1024) { // 400MB 제한 예시
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      showErrorPopup('파일 크기가 너무 큽니다. 400MB 이하의 파일만 업로드 가능합니다.');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'video/avi'];
    if (!allowedTypes.includes(file.type)) {
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      showErrorPopup('지원되지 않는 파일 형식입니다. 이미지 또는 동영상 파일만 업로드 가능합니다.');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // 간단한 fetch 요청
    fetch('https://img.bloupla.net/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      // 로딩 표시기 제거
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      
      if (data && data.success) {
        // URL을 텍스트 영역에 삽입
        insertTextAtCursor(textarea, data.url);
      } else {
        // data.error가 undefined일 수 있으므로 안전하게 처리
        const errorMsg = data && data.error ? data.error : '알 수 없는 오류';
        showErrorPopup('업로드에 실패했습니다: ' + errorMsg);
      }
    })
    .catch(error => {
      // 로딩 표시기 제거
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      
      const errorMessage = error.message || '알 수 없는 오류';
      showErrorPopup('요청 중 오류가 발생했습니다: ' + errorMessage);
    });
  }
  
  // 로딩 표시기 생성 함수
  function createLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'upload-loading-indicator';
    loadingIndicator.style.display = 'inline-block';
    loadingIndicator.style.marginLeft = '10px';
    loadingIndicator.style.verticalAlign = 'middle';
    
    // 스피너 스타일 적용
    loadingIndicator.innerHTML = `
      <div style="width: 14px; height: 14px; border: 3px solid rgba(22, 216, 163, 0.3); 
                  border-radius: 50%; border-top-color: rgb(22, 216, 163); 
                  animation: spinner 1s linear infinite; display: inline-block;"></div>
    `;
    
    // 애니메이션 키프레임 추가
    const styleExists = document.querySelector('style[data-spinner-style]');
    if (!styleExists) {
      const styleSheet = document.createElement('style');
      styleSheet.setAttribute('data-spinner-style', 'true');
      styleSheet.textContent = `
        @keyframes spinner {
          to {transform: rotate(360deg);}
        }
      `;
      document.head.appendChild(styleSheet);
    }
    
    return loadingIndicator;
  }
  
  // 파일 업로드 함수
  function uploadFile(file, buttonElement) {
    // 파일 크기 및 유형 검사
    if (file.size > 400 * 1024 * 1024) { // 400MB 제한 예시
      showErrorPopup('파일 크기가 너무 큽니다. 400MB 이하의 파일만 업로드 가능합니다.');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'video/avi'];
    if (!allowedTypes.includes(file.type)) {
      showErrorPopup('지원되지 않는 파일 형식입니다. 이미지 또는 동영상 파일만 업로드 가능합니다.');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
    
    // 더 직관적인 업로드 진행 표시기 생성
    const loadingIndicator = createLoadingIndicator();
    buttonElement.parentNode.insertBefore(loadingIndicator, buttonElement.nextSibling);
    
    // 간단한 fetch 요청 (user 피드백에 따라 필수 매개변수만 포함)
    fetch('https://img.bloupla.net/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      // 로딩 표시기 제거
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      
      if (data && data.success) {
        // 가장 가까운 textarea 찾기
        const textarea = findSpecificTextarea(buttonElement);
        if (textarea) {
          // URL을 텍스트 영역에 삽입
          insertTextAtCursor(textarea, data.url);
        }
      } else {
        // data.error가 undefined일 수 있으므로 안전하게 처리
        const errorMsg = data && data.error ? data.error : '알 수 없는 오류';
        showErrorPopup('업로드에 실패했습니다: ' + errorMsg);
      }
    })
    .catch(error => {
      // 로딩 표시기 제거
      if (loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
      }
      
      const errorMessage = error.message || '알 수 없는 오류';
      showErrorPopup('요청 중 오류가 발생했습니다: ' + errorMessage);
    });
  }
  
  // 특정 버튼에 연결된 textarea 찾기 (더 정확한 방법)
  function findSpecificTextarea(element) {
    // 1. 먼저 현재 버튼의 가장 가까운 form 또는 댓글 컨테이너 찾기
    let commentContainer = element;
    const maxLevels = 10; // 무한 루프 방지용 최대 상위 요소 탐색 레벨
    let level = 0;
    
    // 먼저 10단계까지 부모 요소를 거슬러 올라가면서 댓글 컨테이너를 찾음
    while (commentContainer && level < maxLevels) {
      // 클래스나 ID로 댓글 컨테이너를 식별할 수 있는 조건 추가
      // 여기서는 컨테이너를 식별할 수 있는 일반적인 클래스명을 예시로 사용
      if (commentContainer.classList && 
          (commentContainer.classList.contains('comment-item') || 
           commentContainer.classList.contains('write-comment') ||
           commentContainer.classList.contains('comment-form') ||
           commentContainer.classList.contains('comment-container'))) {
        break;
      }
      
      // 더 특별한 방법: 컨테이너가 textarea를 포함하는지 확인
      const containsTextarea = commentContainer.querySelector('textarea');
      if (containsTextarea) {
        break;
      }
      
      commentContainer = commentContainer.parentElement;
      level++;
    }
    
    // 댓글 컨테이너를 찾지 못한 경우 기존 방식으로 폴백
    if (!commentContainer || level >= maxLevels) {
      return findNearestTextarea(element);
    }
    
    // 2. 찾은 컨테이너 내에서 textarea 찾기
    const textarea = commentContainer.querySelector('textarea');
    if (textarea) {
      return textarea;
    }
    
    // 3. 여전히 찾지 못했다면 기존 방식으로 폴백
    return findNearestTextarea(element);
  }
  
  // 기존의 가장 가까운 textarea 찾기 (폴백 방식)
  function findNearestTextarea(element) {
    // 직접 지정된 ID로 텍스트 영역 찾기
    const textarea = document.querySelector('textarea#Write');
    if (textarea) return textarea;
    
    // 1. 현재 요소의 부모 요소 내에서 textarea 찾기
    if (element.parentElement) {
      const textareasInParent = element.parentElement.querySelectorAll('textarea');
      if (textareasInParent.length > 0) {
        return textareasInParent[0];
      }
      
      // 2. 부모의 부모 요소 내에서 textarea 찾기
      if (element.parentElement.parentElement) {
        const textareasInGrandparent = element.parentElement.parentElement.querySelectorAll('textarea');
        if (textareasInGrandparent.length > 0) {
          return textareasInGrandparent[0];
        }
      }
    }
    
    // 3. DOM 전체에서 찾기 (fallback)
    const allTextareas = document.querySelectorAll('textarea');
    if (allTextareas.length > 0) {
      return allTextareas[0];
    }
    
    return null;
  }
  
  // 텍스트 영역에 텍스트 삽입 (사용자 입력처럼)
  function insertTextAtCursor(textarea, text) {
    try {
      // 현재 선택 위치를 저장
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      
      // 값 변경
      textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
      
      // 커서 위치 설정
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      
      // 입력 이벤트 발생 (변경 감지용)
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
      
      // 포커스 설정
      textarea.focus();
    } catch (e) {
      showErrorPopup('텍스트 삽입 중 오류가 발생했습니다: ' + (e.message || '알 수 없는 오류'));
    }
  }
  
  // 오류 팝업 표시 함수 - 제공된 CSS 클래스 적용
  function showErrorPopup(errorMsg) {
    try {
      // 기존 오류 팝업 제거
      removeExistingPopups();
      
      // 팝업 생성
      const popupHTML = `
        <div class="entry-dialog-content">
          <div class="css-1jv3xyi ev8ee034">
            <div class="css-1yk1ouh erhe2jp3">
              <div class="css-g386mi ev8ee033">
                ${errorMsg}
                <div class="css-csr0ej ev8ee030">
                  <a role="button" class="css-14leu9c e1hn7usz0">확인</a>
                </div>
              </div>
              <a role="button" class="css-1oo4gei ev8ee032"><span class="blind">close</span></a>
            </div>
          </div>
          <div class="css-9vwqs7 ev8ee031"></div>
        </div>
      `;
      
      // 팝업 요소 생성
      const popupContainer = document.createElement('div');
      popupContainer.className = 'image-uploader-error-popup';
      popupContainer.innerHTML = popupHTML;
      
      // 제공된 CSS 클래스가 적용되도록 document에 스타일 추가
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .css-14leu9c {
          display: inline-block;
          overflow: hidden;
          box-sizing: border-box;
          padding: 0px 48px;
          height: 42px;
          margin: 0px 4px;
          border-radius: 21px;
          border: 1px solid rgb(22, 216, 163);
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          line-height: 42px;
          vertical-align: top;
          transition: background-color 0.3s, border-color 0.3s;
          background-color: rgb(22, 216, 163);
          color: rgb(255, 255, 255);
        }
        
        .css-csr0ej {
          margin-top: 27px;
          text-align: center;
        }
        
        .css-g386mi {
          padding: 42px 20px 45px;
          font-size: 16px;
          color: rgb(0, 0, 0);
          text-align: center;
          line-height: 22px;
          white-space: pre-line;
        }
        
        .css-1yk1ouh {
          position: relative;
          border: 1px solid rgb(233, 233, 233);
          border-radius: 20px;
          background-color: rgb(255, 255, 255);
          box-shadow: rgba(0, 0, 0, 0.06) 0px 1px 1px 0px;
          max-height: calc(100% - 135px);
        }
        
        .css-1jv3xyi {
          position: fixed;
          left: 50%;
          top: 50%;
          min-width: 300px;
          transform: translate(-50%, -50%);
          z-index: 200;
        }
        
        .css-9vwqs7 {
          display: block;
          position: fixed;
          inset: 0px;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 102;
        }
      `;
      document.head.appendChild(styleElement);
      
      // 팝업 이벤트 처리
      document.body.appendChild(popupContainer);
      
      // 확인 및 닫기 버튼 클릭 이벤트
      const confirmButton = popupContainer.querySelector('.css-14leu9c');
      const closeButton = popupContainer.querySelector('.css-1oo4gei');
      
      if (confirmButton) {
        confirmButton.addEventListener('click', () => {
          if (popupContainer.parentNode) {
            document.body.removeChild(popupContainer);
          }
        });
      }
      
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          if (popupContainer.parentNode) {
            document.body.removeChild(popupContainer);
          }
        });
      }
    } catch (e) {
      // 팝업 생성 중 오류가 발생할 경우 기본 alert 사용
      alert(errorMsg);
    }
  }
  
  // 기존 오류 팝업 제거
  function removeExistingPopups() {
    try {
      const existingPopups = document.querySelectorAll('.image-uploader-error-popup');
      existingPopups.forEach(popup => {
        if (popup.parentNode) {
          document.body.removeChild(popup);
        }
      });
    } catch (e) {
      // 에러 처리 (콘솔 로그 제거)
    }
  }
  
  // 모든 textarea에 붙여넣기 이벤트 리스너 추가 (초기 로드 시)
  function initializeAllTextareas() {
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach(textarea => {
      if (!textarea.dataset.pasteListenerAdded) {
        textarea.addEventListener('paste', handlePaste);
        textarea.dataset.pasteListenerAdded = "true";
      }
    });
  }
  
  // 페이지 로드 시 모든 textarea 초기화
  initializeAllTextareas();
  
  // 새로 추가되는 textarea 감지 및 초기화 (MutationObserver 사용)
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // textarea 요소인지 확인
          if (node.nodeName === 'TEXTAREA') {
            if (!node.dataset.pasteListenerAdded) {
              node.addEventListener('paste', handlePaste);
              node.dataset.pasteListenerAdded = "true";
            }
          }
          
          // 자식 요소 중 textarea가 있는지 확인
          if (node.querySelectorAll) {
            const textareas = node.querySelectorAll('textarea');
            textareas.forEach(textarea => {
              if (!textarea.dataset.pasteListenerAdded) {
                textarea.addEventListener('paste', handlePaste);
                textarea.dataset.pasteListenerAdded = "true";
              }
            });
          }
        });
      }
    });
  });
  
  // 전체 문서 변경 관찰 시작
  observer.observe(document.body, { childList: true, subtree: true });  