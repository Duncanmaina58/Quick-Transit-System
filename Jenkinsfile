pipeline {
    agent any
    stages {
        stage('Checkout Code') {
            steps {
                cleanWs()
                checkout scm
            }
        }
        stage('Backend Build (.NET)') {
            steps {
                sh 'chmod +x build-backend.sh'
                sh 'docker run --rm -v $PWD/backend:/app -v $PWD/build-backend.sh:/build.sh -w /app mcr.microsoft.com/dotnet/sdk:9.0 bash /build.sh'
            }
        }
        stage('Frontend Build (Node.js)') {
            steps {
                sh 'chmod +x build-frontend.sh'
                sh 'docker run --rm -v $PWD/frontend:/app -v $PWD/build-frontend.sh:/build.sh -w /app node:20 bash /build.sh'
            }
        }
    }
    post {
        success {
            echo 'CI Pipeline SUCCESS 🎉'
        }
        failure {
            echo 'CI Pipeline FAILED ❌'
        }
    }
}