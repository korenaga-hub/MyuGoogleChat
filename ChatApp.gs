// Google Chat タスク管理Bot - 接続テスト用（最小構成）

function normalizeEvent(event) {
  var user, space, message;
  if (event.chat && event.chat.appCommandPayload) {
    var p = event.chat.appCommandPayload;
    user = p.sender;
    space = p.space;
    message = (p.messagePayload && p.messagePayload.message) ? p.messagePayload.message : null;
  } else if (event.chat && event.chat.buttonClickedPayload) {
    var p = event.chat.buttonClickedPayload;
    user = p.sender;
    space = p.space;
    message = p.message || null;
  } else {
    user = event.user;
    space = event.space;
    message = event.message || null;
  }
  return { user: user, space: space, message: message };
}

function onAppCommand(event) {
  try {
    Logger.log('onAppCommand: ' + JSON.stringify(event).substring(0, 800));
    var commandId = null;
    if (event.chat && event.chat.appCommandPayload && event.chat.appCommandPayload.appCommand) {
      commandId = event.chat.appCommandPayload.appCommand.id;
    } else if (event.message && event.message.slashCommand) {
      commandId = event.message.slashCommand.commandId;
    }
    Logger.log('commandId: ' + commandId);
    var nEvent = normalizeEvent(event);
    if (commandId == 1 || commandId == '1') return buildGroupTaskListResponse(nEvent);
    if (commandId == 2 || commandId == '2') return buildPersonalTaskListResponse(nEvent);
    if (commandId == 3 || commandId == '3') return addTaskFromAction(nEvent, 'group');
    if (commandId == 4 || commandId == '4') return addTaskFromAction(nEvent, 'personal');
    return { text: 'コマンドを受け取りました（ID: ' + commandId + '）' };
  } catch(err) {
    Logger.log('ERROR in onAppCommand: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onMessage(event) {
  try {
    Logger.log('onMessage: ' + JSON.stringify(event).substring(0, 800));
    return { text: 'メッセージを受け取りました。`/tasks` または `/mytasks` をお使いください。' };
  } catch(err) {
    Logger.log('ERROR in onMessage: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function onAddedToSpace(event) {
  Logger.log('onAddedToSpace: ' + JSON.stringify(event).substring(0, 400));
  return { text: 'MyuTask Botが追加されました！\n`/tasks` で全体タスク一覧、`/mytasks` で個人タスク一覧を表示できます。' };
}

function onRemovedFromSpace(event) {
  return {};
}

function completeTask(event) {
  try {
    Logger.log('completeTask: ' + JSON.stringify(event).substring(0, 400));
    var params = {};
    if (event.commonEventObject && event.commonEventObject.parameters) {
      params = event.commonEventObject.parameters;
    } else if (event.action && event.action.parameters) {
      event.action.parameters.forEach(function(p) { params[p.key] = p.value; });
    }
    var taskId = params.taskId;
    var taskType = params.taskType;
    var user = (event.chat && event.chat.buttonClickedPayload) ? event.chat.buttonClickedPayload.sender : (event.user || { name: 'unknown', displayName: '不明' });
    return completeTaskAction({ user: user }, taskId, taskType);
  } catch(err) {
    Logger.log('ERROR in completeTask: ' + err.toString());
    return { text: 'エラー: ' + err.message };
  }
}

function refreshGroupTasks(event) {
  try {
    var space = (event.chat && event.chat.buttonClickedPayload) ? event.chat.buttonClickedPayload.space : (event.space || { name: 'spaces/unknown' });
    return buildGroupTaskListResponse({ space: space });
  } catch(err) {
    return { text: 'エラー: ' + err.message };
  }
}

function refreshPersonalTasks(event) {
  try {
    var sender = (event.chat && event.chat.buttonClickedPayload) ? event.chat.buttonClickedPayload.sender : (event.user || { name: 'users/unknown' });
    var space = (event.chat && event.chat.buttonClickedPayload) ? event.chat.buttonClickedPayload.space : (event.space || { name: 'spaces/unknown' });
    return buildPersonalTaskListResponse({ user: sender, space: space });
  } catch(err) {
    return { text: 'エラー: ' + err.message };
  }
}
