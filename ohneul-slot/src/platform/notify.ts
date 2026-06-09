import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

// 콘솔에서 푸시 템플릿 등록 후 코드로 교체 (출시 단계). 비어 있으면 동의 요청 불가.
export const LUNCH_PUSH_TEMPLATE_CODE = '';

/** 점심 알림 수신 동의 UI 요청. 동의/이미동의 시 true, 거절/오류 시 false. */
export function enableLunchPush(templateCode: string = LUNCH_PUSH_TEMPLATE_CODE): Promise<boolean> {
  return new Promise(resolve => {
    if (!templateCode) { resolve(false); return; }
    try {
      requestNotificationAgreement({
        options: { templateCode },
        onEvent: result => resolve(result.type !== 'agreementRejected'),
        onError: () => resolve(false),
      });
    } catch {
      resolve(false); // 토스 밖/로컬
    }
  });
}
