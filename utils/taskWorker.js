import { parentPort } from 'worker_threads';

parentPort.on('message', (data) => {
  const { type, payload } = data;

  try {
    let result;

    switch (type) {
      case 'sort': 
        //console.log(payload);
        result = payload.sort((a, b) => a.title.localeCompare(b.title)); 
        break;

      case 'filter': 
        //console.log(payload);
        
        result = payload.filter((item) => item.status === 'notstarted'); 
        
        break;

      default:
        throw new Error('Invalid task type');
    }

    parentPort.postMessage({ success: true, result });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
});
