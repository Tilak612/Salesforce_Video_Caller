import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export class salesforceHelper {
    showNotification(self,title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        self.dispatchEvent(evt);
    }
    searchRecords(data, searchTerm) {
        const filteredData = data.filter(item => {
          const { FirstName, LastName } = item;
          if (FirstName && LastName) {
            const fullName = `${FirstName} ${LastName}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
          } else if (LastName) {
            return LastName.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
        
        return filteredData;
      }
     
}