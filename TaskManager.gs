// Google Chat タスク管理Bot - タスクCRUD処理

var GROUP_TASK_SHEET = '全体タスク';
var PERSONAL_TASK_SHEET = '個人タスク';

function getSpreadsheet() {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(spreadsheetId);
}

function addTaskFromAction(event, taskType) {
  var message = event.message;
  var user = event.user;
  var space = event.space;

  var messageText = (message && message.text) ? message.text : '(テキストなし)';
  var truncatedText = messageText.length > 50
    ? messageText.substring(0, 50) + '...'
    : messageText;
  var messageId = (message && message.name) ? message.name : '';
  var spaceId = space.name;
  var spaceName = space.displayName || spaceId;
  var userId = user.name;
  var userName = user.displayName || userId;
  var now = new Date();
  var taskId = Utilities.getUuid();

  var ss = getSpreadsheet();

  if (taskType === 'group') {
    var sheet = ss.getSheetByName(GROUP_TASK_SHEET);
    sheet.appendRow([
      taskId, spaceId, spaceName, messageId, truncatedText,
      userId, userName, '未完了', now, '', ''
    ]);
  } else {
    var sheet = ss.getSheetByName(PERSONAL_TASK_SHEET);
    sheet.appendRow([
      taskId, userId, userName, spaceId, messageId,
      truncatedText, '未完了', now, ''
    ]);
  }

  var threadName = (message && message.thread) ? message.thread.name : null;
  var registeredCard = buildTaskRegisteredCard(truncatedText, taskId, taskType, userName);

  return {
    actionResponse: { type: 'NEW_MESSAGE' },
    thread: threadName ? { name: threadName } : undefined,
    cardsV2: registeredCard.cardsV2
  };
}

function completeTaskAction(event, taskId, taskType) {
  var user = event.user;
  var userName = user.displayName || user.name;
  var now = new Date();

  var ss = getSpreadsheet();

  if (taskType === 'group') {
    var sheet = ss.getSheetByName(GROUP_TASK_SHEET);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === taskId) {
        sheet.getRange(i + 1, 8).setValue('完了');
        sheet.getRange(i + 1, 10).setValue(now);
        sheet.getRange(i + 1, 11).setValue(userName);
        break;
      }
    }
  } else {
    var sheet = ss.getSheetByName(PERSONAL_TASK_SHEET);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === taskId) {
        sheet.getRange(i + 1, 7).setValue('完了');
        sheet.getRange(i + 1, 9).setValue(now);
        break;
      }
    }
  }

  var completedCard = buildCompletedCard(taskType, userName);
  return {
    actionResponse: { type: 'UPDATE_CARD' },
    cardsV2: completedCard.cardsV2
  };
}

function getGroupTasks(spaceId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(GROUP_TASK_SHEET);
  var data = sheet.getDataRange().getValues();
  var tasks = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === spaceId && data[i][7] === '未完了') {
      tasks.push({
        taskId: data[i][0],
        spaceId: data[i][1],
        messageText: data[i][4],
        registeredByName: data[i][6],
        createdAt: data[i][8]
      });
    }
  }
  return tasks;
}

function getPersonalTasks(userId, spaceId) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(PERSONAL_TASK_SHEET);
  var data = sheet.getDataRange().getValues();
  var tasks = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === userId && data[i][3] === spaceId && data[i][6] === '未完了') {
      tasks.push({
        taskId: data[i][0],
        messageText: data[i][5],
        createdAt: data[i][7]
      });
    }
  }
  return tasks;
}
