 // @ts-ignore 

interface ChatAPICallMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
interface ChatAPIFunction {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[]
    }  
}


export const chatCallINT = async(messages: ChatAPICallMessage[]) => {
  let reqBody: Record<string, any> = {messages: messages, temperature: 0.7}
  console.log('using azure')
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `fdd750431bc340d6870356e6ae951c85`,
    },
   
    body: JSON.stringify(reqBody),
  };
  let ftModel = 'ft:gpt-4-0613:raz:exp-big-1:9UKPinzu';

  try {
    // model name is "debug", change with deploy name
    const response = await fetch('https://sweed-instance-raz.openai.azure.com/openai/deployments/debug/chat/completions?api-version=2023-07-01-preview', requestOptions);
    
    const data = await response.json();
    console.log(data);
    if (data.choices[0].message.content != undefined && data.choices[0].message.content != ''){
      return data.choices[0].message.content;
    } else {
      //may have gotten filtered by azure
      return await chatCall(messages, ftModel)
    }
   
  } catch (error) {
      
    console.log(error);
    
    return await chatCall(messages, ftModel);

  }
}





export const chatCallAzureSwiss = async(messages: ChatAPICallMessage[]) => {
  let reqBody: Record<string, any> = {messages: messages, temperature: 0.7}
  console.log('using azure')
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `905374a4ba0542849bf396b6e8742bde`,
    },
   
    body: JSON.stringify(reqBody),
  };

  try {
    const response = await fetch('https://swiss-north-resource.openai.azure.com/openai/deployments/swiss-north/chat/completions?api-version=2023-07-01-preview', requestOptions);
    
    const data = await response.json();
    console.log(data);
    if (data.choices[0].message.content != undefined && data.choices[0].message.content != ''){
      return data.choices[0].message.content;
    } else {
      //may have gotten filtered by azure
      return await chatCall(messages, 'gpt-4');
    }
   
  } catch (error) {
      
    console.log(error);
    
    return await chatCall(messages, 'gpt-4');

  }
}


export const chatCallAzureSweed = async(messages: ChatAPICallMessage[]) => {
  let reqBody: Record<string, any> = {messages: messages, temperature: 0.7}
  console.log('using azure')
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `fdd750431bc340d6870356e6ae951c85`,
    },
   
    body: JSON.stringify(reqBody),
  };

  try {
    const response = await fetch('https://sweed-instance-raz.openai.azure.com/openai/deployments/sweden-central/chat/completions?api-version=2023-07-01-preview', requestOptions);
    
    const data = await response.json();
    console.log(data);
    if (data.choices[0].message.content != undefined){
      return data.choices[0].message.content;
    } else {
      //may have gotten filtered by azure
      return await chatCall(messages, 'gpt-4');
    }
   
  } catch (error) {
      
    console.log(error);
    
    return await chatCall(messages, 'gpt-4');

  }
}


export const chatCallAzureAus = async(messages: ChatAPICallMessage[]) => {
  let reqBody: Record<string, any> = {messages: messages, temperature: 0.7}
  console.log('using azure')
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `df46c41ea1c04ba0b58d3fc86030f138`,
    },
   
    body: JSON.stringify(reqBody),
  };

  try {
    const response = await fetch('https://aus-east-instance.openai.azure.com/openai/deployments/gpt-4-aus-east/chat/completions?api-version=2023-07-01-preview', requestOptions);
    
    const data = await response.json();
    console.log(data);
    if (data.choices[0].message.content != undefined && data.choices[0].message.content != ''){
      return data.choices[0].message.content;
    } else {
      //may have gotten filtered by azure
      return await chatCall(messages, 'gpt-4');
    }
   
  } catch (error) {
      
    console.log(error);
    
    return await chatCall(messages, 'gpt-4');

  }
}

export const chatCallAzure = async(messages: ChatAPICallMessage[]) => {
  let reqBody: Record<string, any> = {messages: messages, temperature: 0.7}
  console.log('using azure')
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `9dc6897c9413494da765352af69cfc26`,
    },
   
    body: JSON.stringify(reqBody),
  };

  try {
    const response = await fetch('https://gpt-4-resource-testraz.openai.azure.com/openai/deployments/why-do-i-have-to-use-canada/chat/completions?api-version=2023-07-01-preview', requestOptions);
    
    const data = await response.json();
    console.log(data);
    if (data.choices[0].message.content != undefined && data.choices[0].message.content != ''){
      return data.choices[0].message.content;
    } else {
      //may have gotten filtered by azure
      return await chatCall(messages, 'gpt-4');
    }

  } catch (error) {
      
    console.log(error);
    
    return await chatCall(messages, 'gpt-4');

  }
}

export const structuredChatCallAzure = async(messages: ChatAPICallMessage[], functions: ChatAPIFunction[], model = 'gpt-4')  => {
  let requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': `9dc6897c9413494da765352af69cfc26`,
    },
    body: JSON.stringify({ model: model, functions: functions, messages: messages, function_call: {'name': functions[0].name}, temperature: 0.2}),
  };
  
  if (functions.length > 1){
    requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': `9dc6897c9413494da765352af69cfc26`,
      },
      body: JSON.stringify({ model: model, functions: functions, messages: messages, temperature: 0.2}),
    };
  }  
  
  try {
    console.log('using azure with structure')
    const response = await fetch('https://gpt-4-resource-testraz.openai.azure.com/openai/deployments/why-do-i-have-to-use-canada/chat/completions?api-version=2023-07-01-preview', requestOptions);
    const data = await response.json();

    if (data.choices[0].message.function_call == undefined){
      return data.choices[0].message.content;
    } else {
      return data.choices[0].message.function_call.arguments;
    }

    } catch (error) {
      console.log(error);

      return await structuredChatCall(messages, functions, 'gpt-4');
    }
  }


export const chatCall = async(messages: ChatAPICallMessage[], model = 'gpt-4') => {
  let reqBody: Record<string, any> = {model : model, messages: messages, temperature: 0.7}
  
  
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
   
    body: JSON.stringify(reqBody),
  };


  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
    
    const data = await response.json();
    console.log(data);
    return data.choices[0].message.content;
  } catch (error) {
      
    console.log(error);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
    const data = await response.json();

    return data.choices[0].message.content;


    //   try {
  //     const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
  //     const data = await response.json();

  //     return data.choices[0].message.content;
  //   } catch (error) {
  //     return 'Ill get back to you';
  //   }
  }
}



export const structuredChatCall = async(messages: ChatAPICallMessage[], functions: ChatAPIFunction[], model = 'gpt-3.5-turbo') => {
  let requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: model, functions: functions, messages: messages, function_call: {'name': functions[0].name}, temperature: 0.2}),
  };
  
  if (functions.length > 1){
    requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: model, functions: functions, messages: messages}),
    };
  }  
  

   try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
      const data = await response.json();

      if (data.choices[0].message.function_call == undefined){
        return data.choices[0].message.content;
      } else {
        return data.choices[0].message.function_call.arguments;
      }

    } catch (error) {
      console.log(error);
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
        const data = await response.json();
        return data.choices[0].message.function_call.arguments;
      } catch (error) {
        return 'Ill get back to you';
      }
    }
  };




export const visionCall = async(messages: ChatAPICallMessage[], model = 'gpt-4-vision-preview') => {
  let requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: model, messages: messages, max_tokens: 300}),
  };

  

   try {
      console.log(requestOptions);
      const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
      const data = await response.json();
      
      return data.choices[0].message.content;

    } catch (error) {
      console.log(error);
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        return 'What was that';
      }
    }
  };