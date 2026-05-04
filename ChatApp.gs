// Google Chat タスク管理Bot - メインハンドラ（Apps Script直接接続方式）

// スラッシュコマンド・クイックコマンド処理
function onAppCommand(event) {
  try {
    var message = event.message;

    if (message && message.slashCommand) {
      var commandId = message.slashCommand.commandId;
      if (commandId == 1) return buildGroupTaskListResponse(event);
      if (commandId == 2) return buildPersonalTaskListResponse(event);
      if (commandId == 3) return addTaskFromAction(event, 'group');
      if (commandId == 4) return addTaskFromAction(event, 'personal');
    }

    return { text: '不明なコマンドです。' };
  } catch (err) {
    Logger.log('onAppCommand error: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

// 通常メッセージ処理
function onMessage(event) {
  try {
    return {
      text: '使い方：`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。'
    };
  } catch (err) {
    Logger.log('onMessage error: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

// カードボタンのクリック処理
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

// スペースに追加されたとき
function onAddedToSpace(event) {
  return {
    text: 'MyuTask Botが追加されました！\n' +
          '`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。'
  };
}

// スペースから削除されたとき
function onRemovedFromSpace(event) {
  Logger.log('Bot removed from space: ' + JSON.stringify(event.space));
}
