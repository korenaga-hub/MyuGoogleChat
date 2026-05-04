// Google Chat タスク管理Bot - メインハンドラ（Apps Script直接接続方式）

function onMessage(event) {
  try {
    var message = event.message;

    if (message && message.slashCommand) {
      var commandId = message.slashCommand.commandId;
      if (commandId == 1) return buildGroupTaskListResponse(event);
      if (commandId == 2) return buildPersonalTaskListResponse(event);
      if (commandId == 3) return addTaskFromAction(event, 'group');
      if (commandId == 4) return addTaskFromAction(event, 'personal');
    }

    return {
      text: '使い方：`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。'
    };
  } catch (err) {
    Logger.log('onMessage error: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onCardAction(event) {
  try {
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
      return completeTaskAction(event, getParam('taskId'), getParam('taskType'));
    }
    if (actionName === 'refreshGroupTasks') {
      return buildGroupTaskListResponse(event);
    }
    if (actionName === 'refreshPersonalTasks') {
      return buildPersonalTaskListResponse(event);
    }

    return { text: '不明なアクションです。' };
  } catch (err) {
    Logger.log('onCardAction error: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onMessageAction(event) {
  try {
    var actionName = '';
    if (event.action) {
      actionName = event.action.actionMethodName || event.action.function || '';
    }

    if (actionName === '全体タスク化' || actionName === 'addGroupTask') {
      return addTaskFromAction(event, 'group');
    }
    if (actionName === '個人タスク化' || actionName === 'addPersonalTask') {
      return addTaskFromAction(event, 'personal');
    }

    return { text: '不明なアクションです。' };
  } catch (err) {
    Logger.log('onMessageAction error: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onSpaceCreated(event) {
  return {
    text: 'MyuTask Botが追加されました！\n' +
          '`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。\n' +
          'メッセージを右クリックして「全体タスク化」「個人タスク化」でタスク登録できます。'
  };
}
