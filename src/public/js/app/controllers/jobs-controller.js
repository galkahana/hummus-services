'use strict';

require('../../../scss/jobs-page.scss'); // app css

jobsController.$inject = ['$scope','GenerationJob'];

function jobsController($scope,GenerationJob) {
    GenerationJob.query().then(function(response) {
        $scope.jobs = response.data;
    },
    function(err) {
        console.log('error!',err);
    });

}

module.exports = jobsController;