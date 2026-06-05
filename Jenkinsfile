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
                sh 'echo "dotnet --version && dotnet restore && dotnet build --configuration Release" > /tmp/dotnet-build.sh'
                sh 'docker run --rm -v $PWD/backend:/app -v /tmp/dotnet-build.sh:/tmp/dotnet-build.sh -w /app mcr.microsoft.com/dotnet/sdk:9.0 bash /tmp/dotnet-build.sh'
            }
        }
        stage('Frontend Build (Node.js)') {
            steps {
                sh 'echo "node --version && npm install && npm run build" > /tmp/node-build.sh'
                sh 'docker run --rm -v $PWD/frontend:/app -v /tmp/node-build.sh:/tmp/node-build.sh -w /app node:20 bash /tmp/node-build.sh'
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