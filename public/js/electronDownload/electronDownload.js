const init = () => {
    ko.applyBindings(viewModel);
    viewModel.getLatest();
};

let viewModel = {
    latestVersion: ko.observable(''),
    releaseDate: ko.observable(''),
    infoVisibility: ko.observable(false),
    getLatest:()=>{
        $.get('/api/electrondownload/files').done((data) => {
            viewModel.latestVersion(data.latestData.split('\n')[0].split(':')[1].split(' ')[1]);
            let date = data.latestData.split('releaseDate:')[1];
            console.log(date);
            viewModel.releaseDate(moment(date, 'YYYY-MM-DDTHH:mm:ssz').format('MMMM Do YYYY, h:mm:ss a'));
        }).fail((err) => {
            console.error('Error during get files:', err);
            alert('something went wrong');
        });
    },
    downloadLatest: () => {
        viewModel.infoVisibility(true);
        window.open(`/api/electrondownload/downloadFile?filename=infoscanjs Setup ${viewModel.latestVersion()}.exe`)
    }
};

$(document).ready(() => {
    init();
});
