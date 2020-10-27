
/**
* takes in a javascript date object and formats it to yy-mm-dd
*/
const formatDate = (date) => {
    let yy = date.getFullYear(),
        mm = date.getMonth() + 1,
        dd = date.getDate();
    return yy + '-' + mm + '-' + dd;
}

const trimSpaces = (str) => {
    return str.replace(/\s/g, ''); 
}

module.exports.formatDate = formatDate; 
module.exports.trimSpaces = trimSpaces; 
