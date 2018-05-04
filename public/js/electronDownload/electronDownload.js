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
            let date = data.latestData.split('releaseDate:')[1].split('').slice(0, -1).join('')+'-0400';
            viewModel.releaseDate(moment(date, 'YYYY-MM-DDTHH:mm:ssZZ').format('MMMM Do YYYY, h:mm:ss a'));
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
