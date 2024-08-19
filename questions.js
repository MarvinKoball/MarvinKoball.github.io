const root = localStorage.getItem('root');
const storageStatus = document.getElementById("storage-status");
if (root && storageStatus) {
    storageStatus.textContent = "there is a file that was parsed";
} else {

    storageStatus.textContent = "no file was parsed"
}
