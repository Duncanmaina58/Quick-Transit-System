pipeline {
    agent any
    environment {
        // Host path that Docker daemon can actually see
        HOST_BASE = "/var/lib/docker/volumes/jenkins_home/_data/workspace/quick-transit-ci"
    }
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }
        stage('Backend Build (.NET)') {
            steps {
                sh 'ls -la backend/'
                sh '''
                    docker run --rm \
                      -v "${HOST_BASE}/backend:/app" \
                      -w /app \
                      mcr.microsoft.com/dotnet/sdk:9.0 \
                      dotnet restore
                '''
                sh '''
                    docker run --rm \
                      -v "${HOST_BASE}/backend:/app" \
                      -w /app \
                      mcr.microsoft.com/dotnet/sdk:9.0 \
                      dotnet build --configuration Release
                '''
            }
        }
  stage('Frontend Build (Node.js)') {
    steps {
        sh 'ls -la frontend/'
        sh '''
            docker run --rm \
              -v "${HOST_BASE}/frontend:/app" \
              -w /app \
              node:20-bullseye \
              npm install
        '''
        sh '''
            docker run --rm \
              -v "${HOST_BASE}/frontend:/app" \
              -w /app \
              node:20-bullseye \
              npm run build
        '''
    }
}
    }
    post {
        success { echo 'CI Pipeline SUCCESS 🎉' }
        failure { echo 'CI Pipeline FAILED ❌' }
    }
}