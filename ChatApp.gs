// Google Chat タスク管理Bot - Apps Script接続タイプ用

function onMessage(event) {
  try {
    Logger.log('onMessage: ' + JSON.stringify(event).substring(0, 500));
    return handleMessage(event);
  } catch(err) {
    Logger.log('ERROR: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onCardClick(event) {
  try {
    Logger.log('onCardClick: ' + JSON.stringify(event).substring(0, 500));
    return handleCardClick(event);
  } catch(err) {
    Logger.log('ERROR: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onAddedToSpace(event) {
  return { text: 'MyuTask Botが追加されました！\n`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。' };
}

function onRemovedFromSpace(event) {
  return {};
}

function handleMessage(event) {
  var message = event.message;

  if (message && message.slashCommand) {
    var commandId = message.slashCommand.commandId;
    Logger.log('commandId: ' + commandId);
    if (commandId == 1) return buildGroupTaskListResponse(event);
    if (commandId == 2) return buildPersonalTaskListResponse(event);
    if (commandId == 3) return addTaskFromAction(event, 'group');
    if (commandId == 4) return addTaskFromAction(event, 'personal');
  }

  return { text: '`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。' };
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

  Logger.log('cardAction: ' + actionName);

  if (actionName === 'completeTask') {
    return completeTaskAction(event, getParam('taskId'), getParam('taskType'));
  }
  if (actionName === 'refreshGroupTasks') return buildGroupTaskListResponse(event);
  if (actionName === 'refreshPersonalTasks') return buildPersonalTaskListResponse(event);

  return { text: '不明なアクションです。' };
}
