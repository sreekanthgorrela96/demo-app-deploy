pipeline {
  agent any

  environment {
    APP_NAME         = 'demo-app'
    APP_VERSION      = '1.0.0'
    AWS_REGION       = "${env.AWS_REGION ?: 'ap-south-2'}"
    AWS_ACCOUNT_ID   = "${env.AWS_ACCOUNT_ID ?: '483955930955'}"
    ECR_REPO         = "${env.ECR_REPO ?: 'demo-app'}"
    REGISTRY         = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    DEPLOY_REPO_URL  = "${env.DEPLOY_REPO_URL ?: 'https://github.com/sreekanthgorrela96/demo-app-deploy.git'}"
    DEPLOY_REPO_CRED = 'github-token2'
    AWS_CRED         = 'aws-jenkins'
    GIT_USER_EMAIL   = 'jenkins@example.com'
    GIT_USER_NAME    = 'Jenkins CI'
  }

  stages {
    stage('Unit Tests') {
      steps {
        sh 'docker build --target test -f Dockerfile .'
      }
    }

    stage('Build Image Tag') {
      steps {
        script {
          env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short=7 HEAD').trim()
          env.IMAGE_TAG = "${APP_VERSION}-${env.GIT_SHA}"
          env.FULL_IMAGE = "${REGISTRY}/${ECR_REPO}:${env.IMAGE_TAG}"
        }
      }
    }

    stage('Build Image') {
      steps {
        sh "docker build -t ${FULL_IMAGE} -f Dockerfile ."
      }
    }

    stage('Trivy Scan') {
      steps {
        sh """
          docker run --rm \\
            -v /var/run/docker.sock:/var/run/docker.sock \\
            aquasec/trivy image \\
              --scanners vuln \\
              --severity HIGH,CRITICAL \\
              --ignore-unfixed \\
              --exit-code 1 \\
              ${FULL_IMAGE}
        """
      }
    }

    stage('ECR Login & Push') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: AWS_CRED,
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY'
        )]) {
          sh """
            docker run --rm \\
              -e AWS_ACCESS_KEY_ID \\
              -e AWS_SECRET_ACCESS_KEY \\
              -e AWS_DEFAULT_REGION=${AWS_REGION} \\
              amazon/aws-cli ecr get-login-password --region ${AWS_REGION} | \\
              docker login --username AWS --password-stdin ${REGISTRY}
            docker push ${FULL_IMAGE}
          """
        }
      }
    }

    stage('Update Deploy Repo (GitOps)') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: DEPLOY_REPO_CRED,
          usernameVariable: 'GIT_USERNAME',
          passwordVariable: 'GIT_PASSWORD'
        )]) {
          sh """
            set -e
            rm -rf deploy-repo
            git clone https://\${GIT_USERNAME}:\${GIT_PASSWORD}@${DEPLOY_REPO_URL.replace('https://', '')} deploy-repo
            cd deploy-repo

            git config user.email "${GIT_USER_EMAIL}"
            git config user.name "${GIT_USER_NAME}"

            sed -i 's|^  repository: .*|  repository: ${REGISTRY}/${ECR_REPO}|' demo-app/values-dev.yaml
            sed -i 's/^  tag: .*/  tag: ${IMAGE_TAG}/' demo-app/values-dev.yaml

            git add demo-app/values-dev.yaml
            git diff --cached --quiet || git commit -m "ci(${APP_NAME}): deploy ${IMAGE_TAG} to dev [skip ci]"
            git push origin main
          """
        }
      }
    }
  }

  post {
    success {
      echo "Image ${FULL_IMAGE} pushed to ECR. Argo CD will sync demo-app-dev automatically."
      echo "Promote to QA: update values-qa.yaml and sync demo-app-qa in Argo CD UI."
    }
  }
}
