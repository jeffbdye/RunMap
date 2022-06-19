pipeline {    
    agent any
    stages {
        stage('Install') {
            steps {
                echo 'Installing...'
                sh 'npm install'
            }
        }
        // Tests run using GitHub Actions
        // stage('Test') {
        //    steps {
        //        echo 'Testing...'
        //        sh 'npm run test'
        //    }
        // }
        // stage('Secrets') {
        //     steps {
        //         echo 'Setting up secrets...'
        //         sh 'rm ./src/appsettings.secrets.ts -f'
        //         withCredentials([file(credentialsId: 'MAPBOX_SECRET', variable: 'MAPBOX_SECRET')]) {
        //             sh 'cp $MAPBOX_SECRET ./src/appsettings.secrets.ts';
        //         }
        //     }
        // }
        stage('Bundle') {
            steps {
                echo 'Bundling...'
                sh 'npm run build'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
                sh 'sh sh/deploy.sh'
            }
        }
    }
}
