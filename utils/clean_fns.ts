 

 export const cleanPhone = (phoneNumber: string) => {
 // phone number format might be 1 123-456-7890, convert to +11234567890
 if (phoneNumber.startsWith('1') && phoneNumber.length == 14){
    phoneNumber = '+1' + phoneNumber.substring(2,5) + phoneNumber.substring(6,9) + phoneNumber.substring(10,14);
  }
  if (phoneNumber.startsWith('+') && phoneNumber.length == 15){
    phoneNumber = '+1' + phoneNumber.substring(3,6) + phoneNumber.substring(7,10) + phoneNumber.substring(11,15);
  }
  if (!phoneNumber.startsWith('+')){
    phoneNumber = '+' + phoneNumber;
  }
  return phoneNumber
}