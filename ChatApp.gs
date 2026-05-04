// Google Chat タスク管理Bot - メインハンドラ

function doPost(e) {
  try {
    const event = JSON.parse(e.postData.contents);
    var response;

    switch (event.type) {
      case 'MESSAGE':
        response = handleMessage(event);
        break;
      case 'CARD_CLICKED':
        response = handleCardClick(event);
        break;
      case 'MESSAGE_ACTION':
        response = handleMessageAction(event);
        break;
      case 'ADDED_TO_SPACE':
        response = {
          text: '👋 MyuTask Botが追加されました！\n' +
                '📋 メッセージを右クリックして「全体タスク化」「個人タスク化」でタスク登録できます。\n' +
                '`/tasks` で全体タスク一覧、`/mytasks` で自分のタスク一覧を表示します。'
        };
        break;
      default:
        response = { text: '' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ text: 'エラーが発生しました: ' + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleMessage(event) {
  var message = event.message;

  if (message.slashCommand) {
    var commandId = message.slashCommand.commandId;
    if (commandId == 1) return buildGroupTaskListResponse(event);
    if (commandId == 2) return buildPersonalTaskListResponse(event);
    if (commandId == 3) return addTaskFromAction(event, 'group');
    if (commandId == 4) return addTaskFromAction(event, 'personal');
  }

  return {
    text: '`/tasks` で全体タスク一覧、`/mytasks` で自分のタスク一覧を表示できます。\n' +
          '「全体タスク化」または「個人タスク化」コマンドでタスクを登録できます。'
  };
}

function handleMessageAction(event) {
  var actionName = event.action.actionMethodName;

  if (actionName === '全体タスク化' || actionName === 'addGroupTask') {
    return addTaskFromAction(event, 'group');
  }
  if (actionName === '個人タスク化' || actionName === 'addPersonalTask') {
    return addTaskFromAction(event, 'personal');
  }

  return { text: '不明なアクションです。' };
}

function handleCardClick(event) {
  var actionName = '';
  if (event.action) {
    actionName = event.action.function || event.action.actionMethodName || '';
  }
  var params = (event.action && event.action.parameters) ? event.action.parameters : [];

  function getParam(key) {
    for (var i = 0; i < params.length; i++) {
      if (params[i].key === key) return params[i].value;
    }
    return null;
  }

  if (actionName === 'completeTask') {
    var taskId = getParam('taskId');
    var taskType = getParam('taskType');
    return completeTaskAction(event, taskId, taskType);
  }
  if (actionName === 'refreshGroupTasks') {
    return buildGroupTaskListResponse(event);
  }
  if (actionName === 'refreshPersonalTasks') {
    return buildPersonalTaskListResponse(event);
  }

  return { text: '不明なアクションです。' };
}
