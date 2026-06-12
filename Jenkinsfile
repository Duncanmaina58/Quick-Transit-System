pipeline {
    agent any
    environment {
        HOST_BASE = "/var/lib/docker/volumes/jenkins_home/_data/workspace/quick-transit-ci"
        DOCKERHUB_USERNAME = "duncanmaina"
        BACKEND_IMAGE = "duncanmaina/quicktransit-backend"
        FRONTEND_IMAGE = "duncanmaina/quicktransit-frontend"
    }
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build (.NET)') {
            steps {
                sh 'docker run --rm -v "${HOST_BASE}/backend:/app" -w /app mcr.microsoft.com/dotnet/sdk:9.0 dotnet restore'
                sh 'docker run --rm -v "${HOST_BASE}/backend:/app" -w /app mcr.microsoft.com/dotnet/sdk:9.0 dotnet build --configuration Release'
            }
        }

        stage('Frontend Build (Node.js)') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

   stage('Build Docker Images') {
    steps {
        sh 'docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -t ${BACKEND_IMAGE}:latest backend/'
        sh 'docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} -t ${FRONTEND_IMAGE}:latest frontend/'
    }
}
stage('Push to Docker Hub') {
    environment {
        NO_PROXY = "registry-1.docker.io,auth.docker.io,production.cloudflare.docker.com"
        no_proxy = "registry-1.docker.io,auth.docker.io,production.cloudflare.docker.com"
    }
    steps {
        withCredentials([usernamePassword(
            credentialsId: 'dockerhub-credentials',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {
            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
            retry(3) { sh 'docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}' }
            retry(3) { sh 'docker push ${BACKEND_IMAGE}:latest' }
            retry(3) { sh 'docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}' }
            retry(3) { sh 'docker push ${FRONTEND_IMAGE}:latest' }
        }
    }
}

stage('Deploy') {
    steps {
        sh 'docker compose -f docker-compose.yml down --remove-orphans'
        sh 'docker compose -f docker-compose.yml up -d --pull always'
    }
}
    }
    post {
        success { echo 'CI/CD Pipeline SUCCESS 🎉' }
        failure { echo 'CI/CD Pipeline FAILED ❌' }
        always {
            sh 'docker logout'
        }
    }
}
