const SPREADSHEET_ID = '1FDPAUA7imWvaGdkaOHKp2HV1ZIeqPCjXnJ0DuSgN87o';
const GROUP_SHEET = '全体タスク';
const PERSONAL_SHEET = '個人タスク';

async function getAccessToken() {
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } }
  );
  const data = await res.json();
  return data.access_token;
}

async function sheetsGet(range) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return await res.json();
}

async function sheetsAppend(range, values) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    }
  );
  return await res.json();
}

async function sheetsUpdate(range, values) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    }
  );
  return await res.json();
}

function wrapMsg(msg) {
  if (!msg || Object.keys(msg).length === 0) return {};
  return { hostAppDataAction: { chatDataAction: { createMessageAction: { message: msg } } } };
}

exports.chatApp = async (req, res) => {
  try {
    const event = req.body;
    const chatForLog = event.chat ? JSON.parse(JSON.stringify(event.chat)) : {};
    if (chatForLog.user) delete chatForLog.user.avatarUrl;
    console.log('ChatFull:', JSON.stringify(chatForLog));
    const response = await processEvent(event);
    res.status(200).json(response);
  } catch (err) {
    console.error('Error:', err);
    res.status(200).json(wrapMsg({ text: 'エラー: ' + err.message }));
  }
};

async function processEvent(event) {
  const chatData = event.chat || {};
  const user = event.user || chatData.user;

  let eventType, message, space, action;

  if (chatData.appCommandPayload) {
    eventType = 'MESSAGE';
    const payload = chatData.appCommandPayload;
    const cmdId = payload.appCommandMetadata && payload.appCommandMetadata.appCommandId;
    message = Object.assign({}, payload.message, { slashCommand: { commandId: cmdId } });
    space = payload.space;
  } else if (chatData.messagePayload) {
    eventType = 'MESSAGE';
    message = chatData.messagePayload.message;
    space   = chatData.messagePayload.space;
  } else if (chatData.buttonClickedPayload) {
    eventType = 'CARD_CLICKED';
    space  = chatData.buttonClickedPayload.space;
    action = chatData.buttonClickedPayload.action;
  } else if (chatData.addedToSpacePayload) {
    eventType = 'ADDED_TO_SPACE';
    space = chatData.addedToSpacePayload.space;
  } else if (chatData.removedFromSpacePayload) {
    eventType = 'REMOVED_FROM_SPACE';
    space = chatData.removedFromSpacePayload.space;
  } else {
    eventType = event.type || 'UNKNOWN';
    message = event.message;
    space   = event.space;
    action  = event.action;
  }

  console.log('EventType:', eventType, 'HasMsg:', !!message, 'HasAction:', !!action);
  const e = { type: eventType, user, space, message, action };

  switch (eventType) {
    case 'MESSAGE':           return await handleMessage(e);
    case 'CARD_CLICKED':      return await handleCardClick(e);
    case 'ADDED_TO_SPACE':
      return wrapMsg({ text: 'MyuTask Botが追加されました！\n`/tasks`で全体タスク一覧、`/mytasks`で個人タスク一覧を表示できます。' });
    case 'REMOVED_FROM_SPACE':
      return {};
    default:
      return wrapMsg({ text: 'MyuTask Bot起動中です。`/tasks` または `/mytasks` をお試しください。' });
  }
}

async function handleMessage(event) {
  const message = event.message;
  if (message && message.slashCommand) {
    const id = message.slashCommand.commandId;
    if (id == 1) return await buildGroupTaskListResponse(event);
    if (id == 2) return await buildPersonalTaskListResponse(event);
    if (id == 3) return await addTaskFromAction(event, 'group');
    if (id == 4) return await addTaskFromAction(event, 'personal');
  }
  return wrapMsg({ text: '`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。' });
}

async function handleCardClick(event) {
  const actionName = event.action ? (event.action.function || event.action.actionMethodName || '') : '';
  const params = (event.action && event.action.parameters) ? event.action.parameters : [];
  const getParam = (key) => { const p = params.find(p => p.key === key); return p ? p.value : null; };
  if (actionName === 'completeTask') return await completeTaskAction(event, getParam('taskId'), getParam('taskType'));
  if (actionName === 'refreshGroupTasks') return await buildGroupTaskListResponse(event);
  if (actionName === 'refreshPersonalTasks') return await buildPersonalTaskListResponse(event);
  return wrapMsg({ text: '不明なアクションです。' });
}

async function addTaskFromAction(event, taskType) {
  const message = event.message;
  const user = event.user;
  const space = event.space;
  const text = (message && message.text) ? message.text : '(テキストなし)';
  const truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;
  const taskId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (taskType === 'group') {
    await sheetsAppend(GROUP_SHEET + '!A:K', [[
      taskId, space.name, space.displayName || space.name,
      (message && message.name) ? message.name : '',
      truncated, user.name, user.displayName || user.name, '未完了', now, '', ''
    ]]);
  } else {
    await sheetsAppend(PERSONAL_SHEET + '!A:I', [[
      taskId, user.name, user.displayName || user.name,
      space.name, (message && message.name) ? message.name : '',
      truncated, '未完了', now, ''
    ]]);
  }

  const icon = taskType === 'group' ? '👥' : '👤';
  const label = taskType === 'group' ? '全体タスク' : '個人タスク';
  return wrapMsg({
    cardsV2: [{ cardId: 'registered_' + taskId, card: {
      header: { title: icon + ' ' + label + 'に登録しました', subtitle: '登録者：' + (user.displayName || user.name) },
      sections: [{ widgets: [
        { textParagraph: { text: '📋 ' + truncated } },
        { buttonList: { buttons: [{ text: '✅ 完了にする', onClick: { action: { function: 'completeTask', parameters: [{ key: 'taskId', value: taskId }, { key: 'taskType', value: taskType }] } } }] } }
      ]}]
    }}]
  });
}

async function completeTaskAction(event, taskId, taskType) {
  const user = event.user;
  const userName = user.displayName || user.name;
  const now = new Date().toISOString();
  const sheetName = taskType === 'group' ? GROUP_SHEET : PERSONAL_SHEET;
  const result = await sheetsGet(sheetName + '!A:K');
  const rows = result.values || [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === taskId) {
      if (taskType === 'group') {
        await sheetsUpdate(sheetName + '!H' + (i+1) + ':K' + (i+1), [['完了', '', now, userName]]);
      } else {
        await sheetsUpdate(sheetName + '!G' + (i+1) + ':I' + (i+1), [['完了', now, '']]);
      }
      break;
    }
  }

  const icon = taskType === 'group' ? '👥' : '👤';
  const label = taskType === 'group' ? '全体タスク' : '個人タスク';
  return wrapMsg({
    actionResponse: { type: 'UPDATE_CARD' },
    cardsV2: [{ cardId: 'completed', card: {
      header: { title: '✅ ' + icon + label + '完了', subtitle: '完了者：' + userName },
      sections: [{ widgets: [{ textParagraph: { text: 'このタスクは完了済みです。お疲れさまでした！' } }] }]
    }}]
  });
}

async function buildGroupTaskListResponse(event) {
  const spaceId = event.space.name;
  const result = await sheetsGet(GROUP_SHEET + '!A:K');
  const rows = result.values || [];
  const tasks = rows.slice(1)
    .filter(r => r[1] === spaceId && r[7] === '未完了')
    .map(r => ({ taskId: r[0], text: r[4], byName: r[6], createdAt: r[8] }));

  const widgets = tasks.length === 0
    ? [{ textParagraph: { text: '🎉 未完了の全体タスクはありません！' } }]
    : tasks.map(t => ({
        decoratedText: {
          topLabel: t.byName + '（' + fmtDate(t.createdAt) + '）',
          text: t.text,
          button: { text: '✅ 完了', onClick: { action: { function: 'completeTask', parameters: [{ key: 'taskId', value: t.taskId }, { key: 'taskType', value: 'group' }] } } }
        }
      }));

  widgets.push({ buttonList: { buttons: [{ text: '🔄 更新', onClick: { action: { function: 'refreshGroupTasks' } } }] } });
  return wrapMsg({ cardsV2: [{ cardId: 'groupTaskList', card: { header: { title: '👥 全体タスク一覧', subtitle: '未完了：' + tasks.length + '件' }, sections: [{ widgets }] } }] });
}

async function buildPersonalTaskListResponse(event) {
  const userId = event.user.name;
  const spaceId = event.space.name;
  const result = await sheetsGet(PERSONAL_SHEET + '!A:I');
  const rows = result.values || [];
  const tasks = rows.slice(1)
    .filter(r => r[1] === userId && r[3] === spaceId && r[6] === '未完了')
    .map(r => ({ taskId: r[0], text: r[5], createdAt: r[7] }));

  const widgets = tasks.length === 0
    ? [{ textParagraph: { text: '🎉 未完了の個人タスクはありません！' } }]
    : tasks.map(t => ({
        decoratedText: {
          topLabel: fmtDate(t.createdAt),
          text: t.text,
          button: { text: '✅ 完了', onClick: { action: { function: 'completeTask', parameters: [{ key: 'taskId', value: t.taskId }, { key: 'taskType', value: 'personal' }] } } }
        }
      }));

  widgets.push({ buttonList: { buttons: [{ text: '🔄 更新', onClick: { action: { function: 'refreshPersonalTasks' } } }] } });
  return wrapMsg({ cardsV2: [{ cardId: 'personalTaskList', card: { header: { title: '👤 あなたの個人タスク', subtitle: '未完了：' + tasks.length + '件' }, sections: [{ widgets }] } }] });
}

function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return (dt.getMonth()+1) + '/' + dt.getDate() + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
  } catch(e) { return ''; }
}
